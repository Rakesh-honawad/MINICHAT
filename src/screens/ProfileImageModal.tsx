// src/components/ProfileImageModal.tsx
import React, { useRef, useState, useEffect } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  Image,
  TouchableOpacity,
  Text,
  PanResponder,
  Dimensions,
  GestureResponderEvent,
  NativeTouchEvent,
} from "react-native";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// Replace with the uploaded local path (developer note)
const SAMPLE_IMAGE_URI = "file:///mnt/data/A_set_of_digital_mockup_images_showcases_three_use.png";

type Props = {
  visible: boolean;
  onClose: () => void;
  imageUri?: string; // if not provided, SAMPLE_IMAGE_URI used
};

export default function ProfileImageModal({ visible, onClose, imageUri }: Props) {
  const uri = imageUri ?? SAMPLE_IMAGE_URI;

  // animated values
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current; // start off-screen
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // image transform values
  const scale = useRef(new Animated.Value(1)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  // pinch tracking
  const lastScale = useRef(1);
  const initialDistance = useRef<number | null>(null);

  // double-tap
  const lastTapRef = useRef<number | null>(null);
  const DOUBLE_TAP_DELAY = 300; // ms
  const ZOOMED_SCALE = 2.2;

  useEffect(() => {
    if (visible) openModal();
    else closeModalImmediate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function openModal() {
    // reset transforms when opening
    scale.setValue(1);
    panX.setValue(0);
    panY.setValue(0);
    lastScale.current = 1;

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0.5,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT / 2, // half screen position (modal top)
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function closeModal() {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(panX, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(panY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      onClose();
    });
  }

  // immediate close without animation (used when visible false initially)
  function closeModalImmediate() {
    backdropOpacity.setValue(0);
    translateY.setValue(SCREEN_HEIGHT);
  }

  // handle double tap to toggle zoom
  function handleTap(evt?: GestureResponderEvent) {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // double tap detected
      toggleZoom();
      lastTapRef.current = null;
    } else {
      lastTapRef.current = now;
      // single tap: close modal (optional). We'll close on single tap outside image area.
    }
  }

  function toggleZoom() {
    const toValue = lastScale.current > 1.01 ? 1 : ZOOMED_SCALE;
    Animated.timing(scale, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      lastScale.current = toValue;
      // reset pan when zooming out
      if (toValue === 1) {
        Animated.timing(panX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        Animated.timing(panY, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      }
    });
  }

  // simple pinch implementation using PanResponder (multi-touch)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // start responding when there's movement or multiple touches
        return gestureState.dx !== 0 || gestureState.dy !== 0 || (gestureState.numberActiveTouches ?? 0) > 1;
      },

      onPanResponderGrant: (_evt) => {
        // reset initial distance for pinch
        initialDistance.current = null;
      },

      onPanResponderMove: (evt, gestureState) => {
        const touches = (evt.nativeEvent as any).touches as NativeTouchEvent[] | undefined;
        // Pinch: when two touches present
        if (touches && touches.length >= 2) {
          const t0 = touches[0];
          const t1 = touches[1];
          const dx = t0.pageX - t1.pageX;
          const dy = t0.pageY - t1.pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (!initialDistance.current) initialDistance.current = dist;
          const scaleFactor = dist / (initialDistance.current || dist);
          const newScale = Math.max(0.8, Math.min(lastScale.current * scaleFactor, 4)); // clamp
          scale.setValue(newScale);
        } else {
          // Pan (one finger) - only allow panning when zoomed
          if (lastScale.current > 1.01) {
            panX.setValue(gestureState.dx);
            panY.setValue(gestureState.dy);
          }
        }
      },

      onPanResponderRelease: () => {
        // finalize pinch/pan
        // if we pinched, update lastScale
        scale.stopAnimation((current: number) => {
          lastScale.current = current;
          // limit min zoom
          if (lastScale.current < 1) {
            lastScale.current = 1;
            scale.setValue(1);
          }
          // if zoomed out, reset pan
          if (lastScale.current <= 1.01) {
            Animated.parallel([
              Animated.timing(panX, { toValue: 0, duration: 150, useNativeDriver: true }),
              Animated.timing(panY, { toValue: 0, duration: 150, useNativeDriver: true }),
            ]).start();
          } else {
            // animate pan back a little if beyond safe boundaries (basic)
            Animated.timing(panX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
            Animated.timing(panY, { toValue: 0, duration: 150, useNativeDriver: true }).start();
          }
        });
        initialDistance.current = null;
      },
    })
  ).current;

  // Animated combined transform
  const animatedImageStyle = {
    transform: [
      { translateX: panX },
      { translateY: panY },
      { scale: scale },
    ],
  };

  // sheet translate style (we position modal by translateY)
  const sheetStyle = {
    transform: [{ translateY }],
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeModal}>
      <View style={styles.wrapper}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />

        {/* Half-screen sheet */}
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* drag handle */}
          <View style={styles.handleBar} />

          {/* header with close */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Profile photo</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* image area */}
          <View style={styles.imageArea}>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.fullFlex}
              onPress={handleTap}
            >
              <Animated.View
                style={[{ alignItems: "center", justifyContent: "center" }, animatedImageStyle]}
                {...panResponder.panHandlers}
              >
                <Image
                  source={{ uri }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT / 2 + 40,
    bottom: 0,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: "#fff",
    paddingTop: 8,
  },
  handleBar: {
    width: 48,
    height: 6,
    backgroundColor: "#ddd",
    alignSelf: "center",
    borderRadius: 4,
    marginVertical: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    justifyContent: "space-between",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    color: "#128C7E",
    fontWeight: "700",
  },
  imageArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  fullFlex: { flex: 1, width: "100%" },
  image: {
    width: Math.min(SCREEN_WIDTH - 40, 420),
    height: SCREEN_HEIGHT / 2 - 80,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
});
