package com.eastbay.trailtracker;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import androidx.core.splashscreen.SplashScreen;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Install the splash screen before super.onCreate()
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        
        // Manual registration is usually not needed in Capacitor 3+ 
        // as plugins are auto-discovered. If you find the plugin still 
        // doesn't load after adding google-services.json, you can 
        // uncomment the line below.
        // registerPlugin(io.capawesome.capacitorjs.plugins.firebase.authentication.FirebaseAuthenticationPlugin.class);
    }
}
