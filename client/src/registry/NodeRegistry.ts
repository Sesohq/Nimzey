import { DataType, NodeCategory, NodeDefinition, PortDefinition } from '@/types';

class NodeRegistryImpl {
  private definitions = new Map<string, NodeDefinition>();
  private categoryCache = new Map<NodeCategory, NodeDefinition[]>();
  private dirty = true;

  register(def: NodeDefinition): void {
    this.definitions.set(def.id, def);
    this.dirty = true;
  }

  registerAll(defs: NodeDefinition[]): void {
    for (const def of defs) {
      this.definitions.set(def.id, def);
    }
    this.dirty = true;
  }

  get(id: string): NodeDefinition | undefined {
    return this.definitions.get(id);
  }

  getAll(): NodeDefinition[] {
    return Array.from(this.definitions.values());
  }

  getByCategory(category: NodeCategory): NodeDefinition[] {
    if (this.dirty) this.rebuildCategoryCache();
    return this.categoryCache.get(category) ?? [];
  }

  getAllCategories(): Map<NodeCategory, NodeDefinition[]> {
    if (this.dirty) this.rebuildCategoryCache();
    return this.categoryCache;
  }

  /**
   * Check if a connection between two ports is valid.
   * Rules:
   * - Map -> Map only
   * - Curve -> Curve only
   * - Numeric -> Map, Curve, or Numeric (universally connectable as input)
   */
  canConnect(sourcePort: PortDefinition, targetPort: PortDefinition): boolean {
    // Same type always connects
    if (sourcePort.dataType === targetPort.dataType) return true;
    // Numeric can connect to anything as a source
    if (sourcePort.dataType === DataType.Numeric) return true;
    return false;
  }

  /**
   * Get the effective data type for a connection.
   * When Numeric connects to Map/Curve, the receiving end interprets it.
   */
  getConnectionDataType(sourcePort: PortDefinition, targetPort: PortDefinition): DataType {
    return targetPort.dataType;
  }

  /**
   * Get default parameter values for a node definition.
   */
  getDefaultParameters(defId: string): Record<string, number | string | boolean | number[]> {
    const def = this.definitions.get(defId);
    if (!def) return {};
    const params: Record<string, number | string | boolean | number[]> = {};
    for (const p of def.parameters) {
      params[p.id] = p.defaultValue;
    }
    return params;
  }

  /**
   * Search node definitions by name, description, or tags.
   */
  search(query: string): NodeDefinition[] {
    const q = query.toLowerCase();
    return this.getAll().filter(def =>
      def.name.toLowerCase().includes(q) ||
      def.description.toLowerCase().includes(q) ||
      def.tags?.some(t => t.toLowerCase().includes(q))
    );
  }

  private rebuildCategoryCache(): void {
    this.categoryCache.clear();
    for (const def of this.definitions.values()) {
      let list = this.categoryCache.get(def.category);
      if (!list) {
        list = [];
        this.categoryCache.set(def.category, list);
      }
      list.push(def);
    }
    // Sort each category alphabetically
    for (const [, list] of this.categoryCache) {
      list.sort((a: NodeDefinition, b: NodeDefinition) => a.name.localeCompare(b.name));
    }
    this.dirty = false;
  }
}

// Singleton instance
export const NodeRegistry = new NodeRegistryImpl();
