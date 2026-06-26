export interface SponsorAsset {
  name: string;
  logoUrl: string;
  prizeAmount: number;
}

export interface EventAssetData {
  id: string;
  slug: string;
  prizesUrl: string;
  backgroundImage: string | null;
  banner: string | null;
  logo: string | null;
  heroImages: string[];
  venue: string | null;
  sponsors: SponsorAsset[];
  totalPrizes: number;
  prizePool: string | null;
  fetchedAt: string;
}

export type EventAssetsMap = Record<string, EventAssetData>;
