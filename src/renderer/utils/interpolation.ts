import { WebcamKeyframe } from '../store/useProjectStore';
import type { ZoomKeyframe } from '../store/useProjectStore';

/**
 * Interpolates between two webcam keyframes at a given time
 */
export function interpolateWebcamKeyframes(
    keyframes: WebcamKeyframe[],
    currentTime: number
): WebcamKeyframe | null {
    if (keyframes.length === 0) return null;
    if (keyframes.length === 1) return keyframes[0];

    // Sort keyframes by time
    const sorted = [...keyframes].sort((a, b) => a.time - b.time);

    // Find keyframes before and after current time
    let beforeKf: WebcamKeyframe | null = null;
    let afterKf: WebcamKeyframe | null = null;

    for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].time <= currentTime) {
            beforeKf = sorted[i];
        }
        if (sorted[i].time > currentTime && !afterKf) {
            afterKf = sorted[i];
            break;
        }
    }

    // If no keyframe before, use first
    if (!beforeKf) return sorted[0];

    // If no keyframe after, use last
    if (!afterKf) return beforeKf;

    // Calculate interpolation progress (0 to 1)
    const duration = afterKf.time - beforeKf.time;
    const elapsed = currentTime - beforeKf.time;
    const progress = Math.min(Math.max(elapsed / duration, 0), 1);

    // Apply easing (ease-in-out)
    const easedProgress = easeInOutCubic(progress);

    // Interpolate numeric values
    return {
        time: currentTime,
        x: lerp(beforeKf.x, afterKf.x, easedProgress),
        y: lerp(beforeKf.y, afterKf.y, easedProgress),
        width: lerp(beforeKf.width, afterKf.width, easedProgress),
        height: lerp(beforeKf.height, afterKf.height, easedProgress),
        scale: lerp(beforeKf.scale, afterKf.scale, easedProgress),
        
        // For discrete values, use threshold at 50%
        shape: progress < 0.5 ? beforeKf.shape : afterKf.shape,
        borderColor: progress < 0.5 ? beforeKf.borderColor : afterKf.borderColor,
        borderWidth: lerp(beforeKf.borderWidth, afterKf.borderWidth, easedProgress),
        shadow: progress < 0.5 ? beforeKf.shadow : afterKf.shadow,
        visible: beforeKf.visible && afterKf.visible, // Both must be visible during transition
    };
}

/**
 * Linear interpolation between two values
 */
function lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
}

/**
 * Ease-in-out cubic easing function
 */
function easeInOutCubic(t: number): number {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Ease-in-out quad (softer than cubic)
 */
export function easeInOutQuad(t: number): number {
    return t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Ease-out back (slight overshoot)
 */
export function easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Interpolates between two zoom keyframes at a given time
 */
export function interpolateZoomKeyframes(
    keyframes: ZoomKeyframe[],
    currentTime: number
): ZoomKeyframe | null {
    if (keyframes.length === 0) return null;
    if (keyframes.length === 1) return keyframes[0];

    const sorted = [...keyframes].sort((a, b) => a.time - b.time);

    let beforeKf: ZoomKeyframe | null = null;
    let afterKf: ZoomKeyframe | null = null;

    for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].time <= currentTime) {
            beforeKf = sorted[i];
        }
        if (sorted[i].time > currentTime && !afterKf) {
            afterKf = sorted[i];
            break;
        }
    }

    if (!beforeKf) return sorted[0];
    if (!afterKf) return beforeKf;

    const duration = afterKf.time - beforeKf.time;
    const elapsed = currentTime - beforeKf.time;
    const progress = Math.min(Math.max(elapsed / duration, 0), 1);

    // Apply the specified easing function
    let easedProgress = progress;
    if (beforeKf.easing === 'ease-in') {
        easedProgress = progress * progress;
    } else if (beforeKf.easing === 'ease-out') {
        easedProgress = 1 - Math.pow(1 - progress, 2);
    } else if (beforeKf.easing === 'ease-in-out') {
        easedProgress = easeInOutCubic(progress);
    }

    return {
        time: currentTime,
        scale: lerp(beforeKf.scale, afterKf.scale, easedProgress),
        centerX: lerp(beforeKf.centerX, afterKf.centerX, easedProgress),
        centerY: lerp(beforeKf.centerY, afterKf.centerY, easedProgress),
        easing: beforeKf.easing,
    };
}
