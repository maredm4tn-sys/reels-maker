import { registerRoot, Composition } from "remotion";
import { ReelsComposition, ReelsCompositionProps } from "./ReelsComposition";

registerRoot(() => {
    return (
        <Composition
            id="ReelsComposition"
            component={ReelsComposition as any}
            fps={30}
            width={1080}
            height={1920}
            calculateMetadata={({ props }) => {
                const reelsProps = props as unknown as ReelsCompositionProps;
                const isPortrait = reelsProps.visuals.aspectRatio === 'portrait';
                const durationInSeconds = (reelsProps.audio.trimEnd || 15) - (reelsProps.audio.trimStart || 0);
                const safeDuration = Math.max(1, Math.min(600, durationInSeconds)); // Max 10 mins

                return {
                    durationInFrames: Math.floor(safeDuration * 30),
                    width: isPortrait ? 1080 : 1920,
                    height: isPortrait ? 1920 : 1080,
                };
            }}
        />
    );
});
