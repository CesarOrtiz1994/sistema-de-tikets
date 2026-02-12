import prisma from '../config/database';

export class BrandingService {
  async getActiveBranding() {
    let branding = await prisma.brandingConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    // Si no existe, crear uno con valores por defecto
    if (!branding) {
      branding = await prisma.brandingConfig.create({
        data: {
          appName: 'SCOT',
          primaryColor: '#9333ea',
          secondaryColor: '#2563eb',
          loginBgType: 'gradient',
          loginBgValue: 'from-slate-900 via-purple-900 to-slate-900',
          isActive: true,
        },
      });
    }

    return branding;
  }

  async updateBranding(
    data: {
      appName?: string;
      logoUrl?: string | null;
      logoSmallUrl?: string | null;
      primaryColor?: string;
      secondaryColor?: string;
      sidebarBgColor?: string;
      sidebarTextColor?: string;
      loginBgType?: string;
      loginBgValue?: string;
      loginBgImageUrl?: string | null;
    },
    userId: string
  ) {
    const current = await this.getActiveBranding();

    return await prisma.brandingConfig.update({
      where: { id: current.id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }
}

export default new BrandingService();
