declare function scanMedia(dir?: string): Promise<{
    images: string[];
    videos: string[];
}>;
declare function scanCode(dir?: string): Promise<string[]>;
export { scanMedia, scanCode };
//# sourceMappingURL=scanner.d.ts.map