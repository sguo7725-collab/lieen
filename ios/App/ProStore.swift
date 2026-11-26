import StoreKit
import UIKit

/// 碎碎清单 Pro on the App Store: one non-consumable in-app purchase, `<bundle id>.pro`
/// (com.suisuiqingdan.app.pro), created in App Store Connect with the price set there.
///
/// Only App Store builds use this (app/pro-config.js `{ store: 'appstore' }`, written by the TestFlight / App Store
/// workflow). The sideloaded IPA and Android buy through the 碎碎清单 Pro server instead — Apple requires its own
/// in-app purchase for unlocking features in App Store apps, so the two never mix.
///
/// The App Store is the only source of truth: Pro is on when StoreKit holds a verified, unrevoked transaction for the
/// product on this Apple ID. The page's own data (and anything copied or imported into it) cannot turn it on.
@MainActor
enum ProStore {
    static var productID: String { (Bundle.main.bundleIdentifier ?? "com.suisuiqingdan.app") + ".pro" }

    /// Last known answer, so the page starts with the right theme before StoreKit has replied (StoreKit corrects it).
    private(set) static var entitled: Bool {
        get { UserDefaults.standard.bool(forKey: "proEntitled") }
        set { UserDefaults.standard.set(newValue, forKey: "proEntitled") }
    }
    private(set) static var displayPrice: String? {
        get { UserDefaults.standard.string(forKey: "proPrice") }
        set { UserDefaults.standard.set(newValue, forKey: "proPrice") }
    }
    private static var product: Product?
    private static var updates: Task<Void, Never>?

    /// Re-reads the entitlement and the localized price. Returns true when the entitlement changed.
    @discardableResult
    static func refresh() async -> Bool {
        let before = entitled
        var now = false
        for await result in Transaction.currentEntitlements {
            if case .verified(let t) = result, t.productID == productID, t.revocationDate == nil { now = true }
        }
        entitled = now
        if product == nil { product = try? await Product.products(for: [productID]).first }
        if let p = product { displayPrice = p.displayPrice }
        return before != now
    }

    /// Purchases made elsewhere (Ask to Buy approved, an offer code redeemed, a refund) arrive here.
    static func listen(_ changed: @escaping @MainActor () -> Void) {
        guard updates == nil else { return }
        updates = Task { @MainActor in
            for await result in Transaction.updates {
                if case .verified(let t) = result { await t.finish() }
                if await ProStore.refresh() { changed() }
            }
        }
    }

    /// The page's request: "buy" | "restore" | "redeem". Answers ok | cancel | pending | fail | none.
    static func run(_ op: String, scene: UIWindowScene?) async -> [String: Any] {
        switch op {
        case "buy":
            if product == nil { product = try? await Product.products(for: [productID]).first }
            guard let product else { return ["op": op, "outcome": "fail"] }
            do {
                switch try await product.purchase() {
                case .success(let verification):
                    guard case .verified(let t) = verification else { return ["op": op, "outcome": "fail"] }
                    await t.finish()
                    await refresh()
                    return ["op": op, "outcome": entitled ? "ok" : "fail"]
                case .userCancelled: return ["op": op, "outcome": "cancel"]
                case .pending: return ["op": op, "outcome": "pending"] // Ask to Buy: arrives later via Transaction.updates
                @unknown default: return ["op": op, "outcome": "fail"]
                }
            } catch { return ["op": op, "outcome": "fail"] }
        case "restore":
            try? await AppStore.sync()
            await refresh()
            return ["op": op, "outcome": entitled ? "ok" : "none"]
        case "redeem":
            // Apple's offer-code sheet; a redeemed code comes back as a transaction through listen()
            if let scene { try? await AppStore.presentOfferCodeRedeemSheet(in: scene) }
            await refresh()
            return ["op": op, "outcome": entitled ? "ok" : "none"]
        default:
            return ["op": op, "outcome": "fail"]
        }
    }
}
