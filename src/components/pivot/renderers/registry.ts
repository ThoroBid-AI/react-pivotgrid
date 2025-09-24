import type { PivotRenderer, RendererRegistry, RendererType, RendererCategory } from '../types/renderer';

export class DefaultRendererRegistry<T extends Record<string, unknown> = Record<string, unknown>>
  implements RendererRegistry<T> {

  private renderers = new Map<string, PivotRenderer<T>>();

  getRenderer(id: string): PivotRenderer<T> | undefined {
    return this.renderers.get(id);
  }

  getAllRenderers(): PivotRenderer<T>[] {
    return Array.from(this.renderers.values());
  }

  getRenderersByType(type: RendererType): PivotRenderer<T>[] {
    return this.getAllRenderers().filter(renderer => renderer.type === type);
  }

  getRenderersByCategory(category: RendererCategory): PivotRenderer<T>[] {
    return this.getAllRenderers().filter(renderer => renderer.category === category);
  }

  getAvailableRenderers(): PivotRenderer<T>[] {
    return this.getAllRenderers().filter(renderer => renderer.isAvailable);
  }

  registerRenderer(renderer: PivotRenderer<T>): void {
    this.renderers.set(renderer.id, renderer);
  }

  unregisterRenderer(id: string): void {
    this.renderers.delete(id);
  }
}

// Create a default registry instance
export const defaultRendererRegistry = new DefaultRendererRegistry();