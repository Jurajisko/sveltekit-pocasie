package com.juraj.pocasie;

import android.app.Activity;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.RequestConfiguration;
import com.google.android.gms.ads.initialization.InitializationStatus;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "InlineAdaptiveBanner")
public class InlineAdaptiveBannerPlugin extends Plugin {
    private final Map<String, SlotState> slots = new HashMap<>();
    private FrameLayout overlayContainer;

    @PluginMethod
    public void initialize(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable");
            return;
        }

        JSArray testingDevices = call.getArray("testingDevices", new JSArray());
        RequestConfiguration.Builder configurationBuilder = MobileAds.getRequestConfiguration().toBuilder();

        if (testingDevices != null && testingDevices.length() > 0) {
            List<String> testDeviceIds = new ArrayList<>();
            for (int i = 0; i < testingDevices.length(); i++) {
                try {
                    testDeviceIds.add(testingDevices.getString(i));
                } catch (JSONException ignored) {
                }
            }
            configurationBuilder.setTestDeviceIds(testDeviceIds);
        }

        MobileAds.setRequestConfiguration(configurationBuilder.build());
        MobileAds.initialize(activity, (InitializationStatus status) -> call.resolve());
    }

    @PluginMethod
    public void showBanner(PluginCall call) {
        String slotId = call.getString("slotId", "default");
        String adUnitId = call.getString("adUnitId");
        Integer widthPx = call.getInt("width");
        Integer xPx = call.getInt("x");
        Integer yPx = call.getInt("y");
        Integer maxHeightPx = call.getInt("maxHeight");

        if (adUnitId == null || adUnitId.isEmpty()) {
            call.reject("adUnitId is required");
            return;
        }

        if (widthPx == null || widthPx <= 0) {
            call.reject("width must be greater than 0");
            return;
        }

        if (xPx == null || yPx == null) {
            call.reject("x and y are required");
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable");
            return;
        }

        activity.runOnUiThread(() -> {
            ensureOverlayContainer(activity);

            SlotState existing = slots.get(slotId);
            if (existing != null) {
                destroySlotView(existing);
            }

            AdView adView = new AdView(activity);
            adView.setAdUnitId(adUnitId);
            adView.setAdSize(buildAdSize(activity, widthPx, maxHeightPx));
            adView.setAdListener(new AdListener() {
                @Override
                public void onAdLoaded() {
                    int loadedHeight = 0;
                    if (adView.getAdSize() != null) {
                        loadedHeight = adView.getAdSize().getHeightInPixels(activity);
                    }
                    if (loadedHeight <= 0) {
                        loadedHeight = adView.getMeasuredHeight();
                    }

                    JSObject payload = new JSObject();
                    payload.put("slotId", slotId);
                    payload.put("width", widthPx);
                    payload.put("height", loadedHeight);
                    notifyListeners("bannerLoaded", payload);
                }

                @Override
                public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                    JSObject payload = new JSObject();
                    payload.put("slotId", slotId);
                    payload.put("code", loadAdError.getCode());
                    payload.put("message", loadAdError.getMessage());
                    notifyListeners("bannerFailed", payload);
                }
            });

            FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(widthPx, ViewGroup.LayoutParams.WRAP_CONTENT);
            layoutParams.leftMargin = xPx;
            layoutParams.topMargin = yPx;
            adView.setLayoutParams(layoutParams);

            overlayContainer.addView(adView);

            SlotState state = new SlotState();
            state.slotId = slotId;
            state.adUnitId = adUnitId;
            state.adView = adView;
            state.widthPx = widthPx;
            state.heightPx = maxHeightPx != null ? maxHeightPx : 0;
            state.xPx = xPx;
            state.yPx = yPx;

            slots.put(slotId, state);

            adView.loadAd(new AdRequest.Builder().build());

            JSObject payload = new JSObject();
            payload.put("slotId", slotId);
            call.resolve(payload);
        });
    }

    @PluginMethod
    public void updateBanner(PluginCall call) {
        String slotId = call.getString("slotId", "default");
        Integer widthPx = call.getInt("width");
        Integer xPx = call.getInt("x");
        Integer yPx = call.getInt("y");
        Integer maxHeightPx = call.getInt("maxHeight");

        SlotState state = slots.get(slotId);
        if (state == null) {
            call.reject("Banner slot not found");
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable");
            return;
        }

        activity.runOnUiThread(() -> {
            boolean shouldReload = false;

            if (widthPx != null && widthPx > 0 && widthPx != state.widthPx) {
                state.widthPx = widthPx;
                shouldReload = true;
            }

            if (maxHeightPx != null && maxHeightPx != state.heightPx) {
                state.heightPx = maxHeightPx;
                shouldReload = true;
            }

            if (xPx != null) {
                state.xPx = xPx;
            }

            if (yPx != null) {
                state.yPx = yPx;
            }

            FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(state.widthPx, ViewGroup.LayoutParams.WRAP_CONTENT);
            layoutParams.leftMargin = state.xPx;
            layoutParams.topMargin = state.yPx;
            state.adView.setLayoutParams(layoutParams);
            state.adView.setVisibility(android.view.View.VISIBLE);

            if (shouldReload) {
                state.adView.setAdSize(buildAdSize(activity, state.widthPx, state.heightPx));
                state.adView.loadAd(new AdRequest.Builder().build());
            }

            JSObject payload = new JSObject();
            payload.put("slotId", slotId);
            call.resolve(payload);
        });
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        String slotId = call.getString("slotId", "default");
        SlotState state = slots.get(slotId);
        if (state == null) {
            call.resolve();
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable");
            return;
        }

        activity.runOnUiThread(() -> {
            state.adView.setVisibility(android.view.View.GONE);
            call.resolve();
        });
    }

    @PluginMethod
    public void destroyBanner(PluginCall call) {
        String slotId = call.getString("slotId", "default");
        SlotState state = slots.remove(slotId);
        if (state == null) {
            call.resolve();
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable");
            return;
        }

        activity.runOnUiThread(() -> {
            destroySlotView(state);
            call.resolve();
        });
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        for (SlotState state : slots.values()) {
            destroySlotView(state);
        }
        slots.clear();
        overlayContainer = null;
    }

    private void ensureOverlayContainer(Activity activity) {
        if (overlayContainer != null) {
            return;
        }

        FrameLayout rootView = activity.findViewById(android.R.id.content);
        overlayContainer = new FrameLayout(activity);
        overlayContainer.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        overlayContainer.setClipChildren(false);
        overlayContainer.setClipToPadding(false);
        rootView.addView(overlayContainer);
    }

    private AdSize buildAdSize(Activity activity, int widthPx, Integer maxHeightPx) {
        int widthDp = Math.max(1, Math.round(widthPx / activity.getResources().getDisplayMetrics().density));
        if (maxHeightPx != null && maxHeightPx > 0) {
            int maxHeightDp = Math.max(1, Math.round(maxHeightPx / activity.getResources().getDisplayMetrics().density));
            return AdSize.getInlineAdaptiveBannerAdSize(widthDp, maxHeightDp);
        }
        return AdSize.getCurrentOrientationInlineAdaptiveBannerAdSize(activity, widthDp);
    }

    private void destroySlotView(SlotState state) {
        if (state.adView == null) {
            return;
        }

        if (overlayContainer != null) {
            overlayContainer.removeView(state.adView);
        }

        state.adView.destroy();
        state.adView = null;
    }

    private static class SlotState {
        String slotId;
        String adUnitId;
        AdView adView;
        int widthPx;
        int heightPx;
        int xPx;
        int yPx;
    }
}
