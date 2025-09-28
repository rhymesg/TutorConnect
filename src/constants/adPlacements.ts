export const adPlacementIds = {
  vertical160x600: 'vertical160x600',
  horizontal728x90: 'horizontal728x90',
  horizontalMobile320x50: 'horizontalMobile320x50',
} as const;

export type AdPlacementId = typeof adPlacementIds[keyof typeof adPlacementIds];

type PlacementConfig = {
  key: string;
  width: number;
  height: number;
};

export const adPlacementConfig: Record<AdPlacementId, PlacementConfig> = {
  [adPlacementIds.vertical160x600]: {
    key: 'a5659616e7810115e1f11798ce145254',
    width: 160,
    height: 600,
  },
  [adPlacementIds.horizontal728x90]: {
    key: 'f518bfdff1cb8fbf49eb32474cb013ca',
    width: 728,
    height: 90,
  },
  [adPlacementIds.horizontalMobile320x50]: {
    key: '76d0f267be29a5359c9156029262c853',
    width: 320,
    height: 50,
  },
};
