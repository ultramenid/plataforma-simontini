export type Severity = "high" | "medium" | "low";

export type CrossingType =
  | "watershed"
  | "province"
  | "district"
  | "island"
  | "protected"
  | "concession"
  | "community"
  | "moratorium";

export interface Crossing {
  type: CrossingType;
  name: string;
  ha: number;
}

export interface CrosscutItem {
  type: CrossingType;
  name: string;
  ha: number;
}

export interface AlertStory {
  title: string;
  body: string[];
}

export interface Polygon {
  type: "Polygon";
  coordinates: number[][][];
}

export interface AlertBase {
  id: string;
  country: string;
  region: string;
  province: string;
  district: string;
  island: string | null;
  lng: number;
  lat: number;
  km: number;
  date: string;
  publishedDate: string;
  ha: number;
  severity: Severity;
  driver: string;
  confidence: number;
  source: string;
  originalSource: string;
  crosscut: CrosscutItem[];
  crossings: Crossing[];
  story: AlertStory | null;
}

export interface Alert extends AlertBase {
  geometry: Polygon;
  before: string;
  after: string;
}

export interface AlertFeature {
  type: "Feature";
  id: string;
  properties: {
    id: string;
    severity: Severity;
    country: string;
    ha: number;
    date: string;
  };
  geometry: Polygon;
}

export interface AlertFeatureCollection {
  type: "FeatureCollection";
  features: AlertFeature[];
}

export type DateMode = "detected" | "published";

export interface Filters {
  dateMode: DateMode;
  monthFrom: number;
  monthTo: number;
  haFrom: number;
  haTo: number;
  country: string;
  driver: string;
  source: string;
  code: string;
}

export type BasemapKey = "map" | "sat";