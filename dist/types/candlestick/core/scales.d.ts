export declare class TimeScale {
    width: number;
    barSpacing: number;
    rightOffset: number;
    baseIndex: number;
    readonly minSpacing = 0.5;
    readonly maxSpacing = 80;
    indexToX(i: number): number;
    xToIndex(x: number): number;
    setBarSpacing(s: number): void;
    /** Zoom keeping the bar under `x` fixed (same maths as lightweight-charts). */
    zoom(x: number, scale: number): void;
    constrain(): void;
    visibleRange(): {
        from: number;
        to: number;
    };
}
export declare class PriceScale {
    height: number;
    min: number;
    max: number;
    auto: boolean;
    log: boolean;
    invert: boolean;
    marginTop: number;
    marginBottom: number;
    private tr;
    private itr;
    private get innerTop();
    private get inner();
    setRange(lo: number, hi: number): void;
    priceToY(p: number): number;
    yToPrice(y: number): number;
    /** Scale range around its center in transformed space. */
    scaleFrom(startMin: number, startMax: number, factor: number): void;
    panFrom(startMin: number, startMax: number, dy: number): void;
}
/** Kinetic scroll — port of lightweight-charts' KineticAnimation. */
export declare class Kinetic {
    private minSpeed;
    private maxSpeed;
    private damping;
    private minMove;
    private positions;
    private startPos;
    private speed;
    private duration;
    constructor(minSpeed?: number, maxSpeed?: number, damping?: number, minMove?: number);
    reset(): void;
    addPosition(position: number, time: number): void;
    start(position: number, time: number): boolean;
    position(time: number): number;
    finished(time: number): boolean;
}
