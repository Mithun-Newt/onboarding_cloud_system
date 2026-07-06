import { AIToolConfig } from './types';
import { searchRegistrationsTool } from './tools/search-registrations';
import { getAdmissionDetailsTool } from './tools/get-admission-details';
import { getAdmissionStatusTool } from './tools/get-admission-status';
import { checkSeatCapacityTool } from './tools/check-seat-capacity';
import { getMissingDocumentsTool } from './tools/get-missing-documents';
import { getPendingDuesTool } from './tools/get-pending-dues';
import { searchGradeOptionsTool } from './tools/search-grade-options';
import { braveSearchTool } from './tools/brave-search';

// Operational Intelligence Tools
import { getDailyActionItemsTool } from './tools/get-daily-action-items';
import { generateCollectionReportTool } from './tools/generate-collection-report';
import { getDashboardSummaryTool } from './tools/get-dashboard-summary';
import { getTodayRegistrationsTool } from './tools/get-today-registrations';
import { getTodayAdmissionsTool } from './tools/get-today-admissions';
import { getRegistrationConversionSummaryTool } from './tools/get-registration-conversion-summary';
import { getRouteManifestTool } from './tools/get-route-manifest';
import { getTransportSummaryTool } from './tools/get-transport-summary';
import { getDailyAiBriefingTool } from './tools/get-daily-ai-briefing';

/**
 * Centralized Tool Registry for the School AI Coworker.
 * Tools are registered here to be made available to the AI.
 */
export const toolRegistry: Record<string, AIToolConfig> = {
  search_registrations: searchRegistrationsTool,
  get_admission_details: getAdmissionDetailsTool,
  get_admission_status: getAdmissionStatusTool,
  check_seat_capacity: checkSeatCapacityTool,
  get_missing_documents: getMissingDocumentsTool,
  get_pending_dues: getPendingDuesTool,
  search_grade_options: searchGradeOptionsTool,
  brave_search: braveSearchTool,
  
  // Operational Intelligence Tools
  get_daily_action_items: getDailyActionItemsTool,
  generate_collection_report: generateCollectionReportTool,
  get_dashboard_summary: getDashboardSummaryTool,
  get_today_registrations: getTodayRegistrationsTool,
  get_today_admissions: getTodayAdmissionsTool,
  get_registration_conversion_summary: getRegistrationConversionSummaryTool,
  get_route_manifest: getRouteManifestTool,
  get_transport_summary: getTransportSummaryTool,
  get_daily_ai_briefing: getDailyAiBriefingTool,
};
