import { LearningPackage, LearningParameters, ConsistencyReport } from '../types/learning';

export class ApiService {
  public static async generatePackage(parameters: LearningParameters): Promise<LearningPackage> {
    const response = await fetch('/api/package/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
}
