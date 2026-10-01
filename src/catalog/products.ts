import type { Product } from '@/checkout/types'

export const products: Product[] = [
  {
    id: 1,
    name: 'Caneca Essencial',
    description: 'Cerâmica · Areia · 300 ml',
    price: 4900,
    image: 'mug.svg',
  },
  {
    id: 2,
    name: 'Caderno de Ideias',
    description: 'Papel pontilhado · Verde · A5',
    price: 3900,
    image: 'notebook.svg',
  },
  {
    id: 3,
    name: 'Bolsa de Todos os Dias',
    description: 'Algodão natural · Cru',
    price: 6900,
    image: 'bag.svg',
  },
  {
    id: 4,
    name: 'Garrafa Dia a Dia',
    description: 'Aço inox · Grafite · 500 ml',
    price: 8900,
    image: 'bottle.svg',
  },
  {
    id: 5,
    name: 'Estojo de Ideias',
    description: 'Algodão · Verde oliva',
    price: 2900,
    image: 'pencil-case.svg',
  },
]
