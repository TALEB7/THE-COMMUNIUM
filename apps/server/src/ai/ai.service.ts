import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface EmbeddingResult {
  id: string;
  embedding: number[];
  model: string;
  dimensions: number;
}

export interface SimilarItem {
  id: string;
  score: number;
}

export interface RecommendationItem {
  listing_id: string;
  relevance_score: number;
  diversity_score: number;
  final_score: number;
}

export interface MentorMatchItem {
  mentor_profile_id: string;
  score: number;
  semantic_score: number;
  rating_score: number;
  experience_score: number;
  sessions_score: number;
}

export interface MentorCandidate {
  mentor_profile_id: string;
  embedding: number[];
  rating: number;
  years_exp: number;
  total_sessions: number;
  is_available: boolean;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly http: HttpService) {}

  async embedListing(params: {
    listingId: string;
    title: string;
    description: string;
    tags: string[];
    category?: string;
  }): Promise<EmbeddingResult> {
    const { data } = await firstValueFrom(
      this.http.post<EmbeddingResult>('/embeddings/listing', {
        listing_id: params.listingId,
        title: params.title,
        description: params.description,
        tags: params.tags,
        category: params.category ?? '',
      }),
    );
    return data;
  }

  async embedMentor(params: {
    mentorProfileId: string;
    headline: string;
    bio: string;
    expertise: string[];
    industries: string[];
  }): Promise<EmbeddingResult> {
    const { data } = await firstValueFrom(
      this.http.post<EmbeddingResult>('/embeddings/mentor', {
        mentor_profile_id: params.mentorProfileId,
        headline: params.headline,
        bio: params.bio,
        expertise: params.expertise,
        industries: params.industries,
      }),
    );
    return data;
  }

  async detectPriceAnomaly(params: {
    price: number;
    comparablePrices: number[];
  }): Promise<{ is_anomaly: boolean; z_score: number; modified_z_score: number; market_median: number; market_mean: number; direction: string; confidence: number }> {
    const { data } = await firstValueFrom(
      this.http.post('/anomaly/price', {
        price: params.price,
        comparable_prices: params.comparablePrices,
      }),
    );
    return data;
  }

  async getPersonalizedRecommendations(params: {
    userEmbedding: number[];
    candidates: Array<{ listing_id: string; embedding: number[] }>;
    topK?: number;
    diversityLambda?: number;
  }): Promise<RecommendationItem[]> {
    const { data } = await firstValueFrom(
      this.http.post<{ recommendations: RecommendationItem[] }>('/recommendations/listings', {
        user_embedding: params.userEmbedding,
        candidates: params.candidates,
        top_k: params.topK ?? 20,
        diversity_lambda: params.diversityLambda ?? 0.3,
      }),
    );
    return data.recommendations;
  }

  async predictChurn(users: Array<{
    user_id: string;
    days_since_last: number;
    action_count_30d: number;
    listing_count: number;
    session_count: number;
    tks_spent: number;
    account_age_days: number;
    membership_active: boolean;
    monthly_tks_spent?: number;
    membership_revenue?: number;
  }>): Promise<{
    predictions: Array<{
      user_id: string;
      churn_score: number;
      risk_level: string;
      rfm_recency: number;
      rfm_frequency: number;
      rfm_monetary: number;
      recommended_actions: string[];
      clv_estimate: number;
      clv_tier: string;
    }>;
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
  }> {
    const { data } = await firstValueFrom(
      this.http.post('/churn/predict', { users }),
    );
    return data;
  }

  async getTrendingCategories(params: {
    dataPoints: Array<{
      category: string;
      date: string;
      view_count: number;
      search_count: number;
      listing_count: number;
    }>;
    topK?: number;
    windowDays?: number;
  }): Promise<{ trending: Array<{ category: string; trend_score: number; growth_rate: number; avg_daily_views: number }>; computed_at: string }> {
    const { data } = await firstValueFrom(
      this.http.post('/trending/categories', {
        data_points: params.dataPoints,
        top_k: params.topK ?? 10,
        window_days: params.windowDays ?? 7,
      }),
    );
    return data;
  }

  async detectReviewFraud(
    reviews: Array<{ text: string; rating: number; reviewer_id: string; created_at: string; listing_id: string }>,
    listingId: string,
  ): Promise<{ is_suspicious: boolean; anomaly_score: number; flags: string[] }> {
    const { data } = await firstValueFrom(
      this.http.post('/fraud/reviews', { reviews, listing_id: listingId }),
    );
    return data;
  }

  async analyzeSentiment(texts: string[]): Promise<{
    results: Array<{ text: string; label: string; score: number; compound: number }>;
    avg_compound: number;
  }> {
    const { data } = await firstValueFrom(
      this.http.post('/sentiment/analyze', { texts }),
    );
    return data;
  }

  async classifyListing(params: {
    title: string;
    description: string;
    availableCategories: string[];
  }): Promise<{ predicted_category: string; confidence: number; suggested_tags: string[]; urgency: string }> {
    const { data } = await firstValueFrom(
      this.http.post('/classify/listing', {
        title: params.title,
        description: params.description,
        available_categories: params.availableCategories,
      }),
    );
    return data;
  }

  async suggestPrice(params: {
    condition: string;
    comparablePrices: number[];
  }): Promise<{ min_price: number; max_price: number; recommended_price: number; confidence: number; method: string }> {
    const { data } = await firstValueFrom(
      this.http.post('/pricing/suggest', {
        title: '',
        description: '',
        category: '',
        condition: params.condition,
        comparable_prices: params.comparablePrices,
      }),
    );
    return data;
  }

  async matchMentors(params: {
    queryEmbedding: number[];
    candidates: MentorCandidate[];
    topK?: number;
  }): Promise<MentorMatchItem[]> {
    const { data } = await firstValueFrom(
      this.http.post<{ matches: MentorMatchItem[] }>('/mentors/match', {
        query_embedding: params.queryEmbedding,
        candidates: params.candidates,
        top_k: params.topK ?? 10,
      }),
    );
    return data.matches;
  }

  async predictEta(params: {
    categoryName?: string;
    sellerCity?: string;
    buyerCity?: string;
    condition?: string;
    sellerListingCount: number;
    hourOfDay?: number;
    dayOfWeek?: number;
  }): Promise<{ eta_minutes: number; eta_hours: number; eta_days: number; confidence: number; breakdown: Record<string, string | number> }> {
    const { data } = await firstValueFrom(
      this.http.post('/eta/predict', {
        category_name:         params.categoryName,
        seller_city:           params.sellerCity,
        buyer_city:            params.buyerCity,
        condition:             params.condition,
        seller_listing_count:  params.sellerListingCount,
        hour_of_day:           params.hourOfDay,
        day_of_week:           params.dayOfWeek,
      }),
    );
    return data;
  }

  async findSimilarListings(params: {
    listingId: string;
    queryEmbedding: number[];
    candidates: Array<{ listing_id: string; embedding: number[] }>;
    topK?: number;
  }): Promise<SimilarItem[]> {
    const { data } = await firstValueFrom(
      this.http.post<{ listing_id: string; similar: SimilarItem[] }>(
        '/similarity/listings',
        {
          listing_id: params.listingId,
          query_embedding: params.queryEmbedding,
          candidate_embeddings: params.candidates,
          top_k: params.topK ?? 5,
        },
      ),
    );
    return data.similar;
  }
}
