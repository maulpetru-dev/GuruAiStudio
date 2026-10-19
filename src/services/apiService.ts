import { LearningPackage, LearningParameters, ConsistencyReport, AlignmentValidationResult } from '../types/learning';

let currentAuthToken: string | null = null;

export class ApiService {
  /**
   * Set or clear the Firebase Authentication ID token.
   * When set, all requests to the AI endpoints include Authorization: Bearer <token>.
   */
  public static setAuthToken(token: string | null) {
    currentAuthToken = token;
  }

  public static getAuthToken(): string | null {
    return currentAuthToken;
  }

  private static getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (currentAuthToken) {
      headers['Authorization'] = `Bearer ${currentAuthToken}`;
    }
    return headers;
  }

  public static async generatePackage(parameters: LearningParameters): Promise<LearningPackage> {
    const response = await fetch('/api/package/generate', {
      method: 'POST',
      headers: ApiService.getHeaders(),
      body: JSON.stringify({ parameters }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Gagal menghasilkan paket pembelajaran. Periksa sambungan atau pengaturan server.');
    }

    return data.package as LearningPackage;
  }

  public static async refineSection(
    sectionKey: keyof LearningPackage,
    sectionTitle: string,
    currentContent: string,
    instruction: string,
    parameters: LearningParameters,
    learningObjectives: string
  ): Promise<string> {
    const response = await fetch('/api/section/refine', {
      method: 'POST',
      headers: ApiService.getHeaders(),
      body: JSON.stringify({
        sectionKey,
        sectionTitle,
        currentContent,
        instruction,
        parameters,
        learningObjectives,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Gagal merevisi bagian terpilih.');
    }

    return data.updatedContent as string;
  }

  public static async checkConsistency(
    parameters: LearningParameters,
    pkg: LearningPackage
  ): Promise<ConsistencyReport> {
    const response = await fetch('/api/package/consistency', {
      method: 'POST',
      headers: ApiService.getHeaders(),
      body: JSON.stringify({ parameters, package: pkg }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Gagal memeriksa keselarasan perangkat pembelajaran.');
    }

    return data.report as ConsistencyReport;
  }

  public static async chatWithAssistant(
    message: string,
    activeSection: string,
    parameters: LearningParameters,
    currentSectionContent: string
  ): Promise<string> {
    const response = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: ApiService.getHeaders(),
      body: JSON.stringify({
        message,
        activeSection,
        parameters,
        currentSectionContent,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Asisten AI tidak dapat merespons.');
    }

    return data.reply as string;
  }

  /**
   * Background validation helper that reviews the updated lesson plan section
   * against the learning objectives to detect alignment drift.
   */
  public static async validateSectionAlignment(
    sectionKey: keyof LearningPackage,
    sectionTitle: string,
    sectionContent: string,
    learningObjectives: string,
    parameters: LearningParameters,
    signal?: AbortSignal
  ): Promise<AlignmentValidationResult> {
    const response = await fetch('/api/section/validate-alignment', {
      method: 'POST',
      headers: ApiService.getHeaders(),
      body: JSON.stringify({
        sectionKey,
        sectionTitle,
        sectionContent,
        learningObjectives,
        parameters,
      }),
      signal,
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Gagal memvalidasi keselarasan seksi.');
    }

    return data.result as AlignmentValidationResult;
  }
}
