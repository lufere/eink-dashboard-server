export const TASK_MAPPINGS = {
    'dishes': 'Lavar platos',
    'supplements': 'Restock suplementos',
    'dish-soap': "Rellenar jabon platos",
}

export type taskMappingKey = keyof typeof TASK_MAPPINGS;