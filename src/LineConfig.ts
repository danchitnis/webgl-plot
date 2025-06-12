export interface LineConfig {
  points: Float32Array;
  color: [number, number, number, number];
  thickness: number;
  scale?: [number, number];
  offset?: [number, number];
  enabled?: boolean;
}
