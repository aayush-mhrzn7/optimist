export interface VideoOptions {
    files: string[];
    dryRun: boolean;
    deleteOriginals: boolean;
    cpuUsed: number;
}
export declare function convertVideos(options: VideoOptions): Promise<Record<string, string>>;
//# sourceMappingURL=video-converter.d.ts.map