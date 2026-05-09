export interface ICreateReviewPayload {
  listingId: string;
  rating: number;
  comment?: string;
}

export interface IUpdateReviewPayload {
  rating?: number;
  comment?: string;
}

export interface IReviewFilter {
  listingId?: string;
  userId?: string;
  rating?: number;
  page?: number;
  limit?: number;
}