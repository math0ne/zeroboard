export interface Card {
  id: string
  title: string
  content: string
  color: string
  tags: string[]
  createdAt: string
  updatedAt: string
  collapsed?: boolean
}

export interface Column {
  id: string
  title: string
  color: string
  cards: Card[]
}
