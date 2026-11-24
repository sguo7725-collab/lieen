plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "io.github.lieen111.suisui"
    compileSdk = 35

    defaultConfig {
        applicationId = "io.github.lieen111.suisui"
        minSdk = 26
        targetSdk = 35
        // 1.22: minutes since 1970 instead of the CI run number. The run number restarts at 1 in a new repository
        // (the build moved to another GitHub account), which Android treats as a downgrade (install error -25).
        // Minutes always grow, stay far above any old run number, and fit Android's 2,100,000,000 limit for ~4000 years.
        versionCode = (System.currentTimeMillis() / 60000L).toInt()
        versionName = "1.22.0"
    }

    // Release key comes from CI secrets (ANDROID_KEYSTORE_B64 / ANDROID_KEYSTORE_PASSWORD), never from the repo.
    // Without them the build falls back to the public TEST key, which is fine for trying the app but
    // must not be used for public distribution (anyone could sign a fake update with it).
    val releaseStore = System.getenv("SUISUI_KEYSTORE")?.let { file(it) }?.takeIf { it.exists() }
    signingConfigs {
        create("test") {
            storeFile = file("../keystore/suisui-test.jks")
            storePassword = "suisui-test"
            keyAlias = "suisui"
            keyPassword = "suisui-test"
        }
        if (releaseStore != null) {
            create("private") {
                storeFile = releaseStore
                storePassword = System.getenv("SUISUI_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("SUISUI_KEY_ALIAS") ?: "suisui"
                keyPassword = System.getenv("SUISUI_KEYSTORE_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName(if (releaseStore != null) "private" else "test")
        }
        debug {
            signingConfig = signingConfigs.getByName("test")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }

    // The web app in ../../app is bundled as-is and served from https://appassets.androidplatform.net/assets/
    sourceSets["main"].assets.srcDir("build/generated/webapp")
}

val copyWebApp by tasks.registering(Sync::class) {
    from(rootProject.file("../app")) {
        exclude("README.md", "*-preview.png")
    }
    into(layout.buildDirectory.dir("generated/webapp"))
}
tasks.named("preBuild") { dependsOn(copyWebApp) }

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
}
