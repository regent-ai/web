declare module "heerich" {
  export const Heerich: {
    new (options?: {
      tile?: [number, number]
      camera?: Record<string, unknown>
      style?: Record<string, unknown>
    }): Record<string, unknown>
    fromJSON?: (data: Record<string, unknown>) => Record<string, unknown>
  }
}
