import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0914',
  },
  mainWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -100,
    left: '15%',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: 40,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(153, 27, 27, 0.18)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 60,
  },

  // Header
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
    marginBottom: 12,
    gap: 6,
  },
  headerBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#A78BFA',
  },
  headerBadgeText: {
    color: '#DDD6FE',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  // Bimestre Selector Pill
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 26,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  selectorTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  selectorTabActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.32)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.4)',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 6px rgba(139, 92, 246, 0.3)',
      },
      default: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
      },
    }),
  },
  selectorTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  selectorTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  selectorCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  selectorCountBadgeActive: {
    backgroundColor: '#8B5CF6',
  },
  selectorCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D1D5DB',
  },
  selectorCountTextActive: {
    color: '#FFFFFF',
  },

  // Seções
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  sectionIndicatorDotWine: {
    backgroundColor: '#EF4444',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F3F4F6',
    letterSpacing: -0.3,
  },
  sectionTag: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Featured Hero Card (Adega - 2º Bimestre)
  featuredCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(40, 10, 20, 0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    marginBottom: 18,
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 16px rgba(239, 68, 68, 0.25)',
      },
      default: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  specularLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    width: '100%',
  },
  featuredCardBody: {
    padding: 20,
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(252, 165, 165, 0.4)',
  },
  featuredBadgeText: {
    color: '#FEE2E2',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  featuredNumber: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  featuredDescription: {
    fontSize: 13,
    color: '#E5E7EB',
    lineHeight: 19,
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  tagChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  tagChipText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '600',
  },
  featuredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#991B1B',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 8px rgba(239, 68, 68, 0.4)',
      },
      default: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  featuredButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Placeholder Card (Próxima atividade)
  placeholderCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  placeholderIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  placeholderSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Standard Glass Activity Cards (1º Bimestre) - Responsivo
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  glassCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  glassCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  cardIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTextBox: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cardArrowBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // Footer
  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  footerBadge: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '700',
  },
});
