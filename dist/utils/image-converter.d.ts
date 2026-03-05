export interface ImageOptions {
    files: string[];
    quality: number;
    dryRun: boolean;
    deleteOriginals: boolean;
}
export declare function convertImages(options: ImageOptions): Promise<Record<string, string>>;
//# sourceMappingURL=image-converter.d.ts.map