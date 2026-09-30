import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#400303',
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },

  // Header
  header: {
    height: 56,
    backgroundColor: '#400303',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerBackBtn: {
    position: 'absolute',
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 10,
  },
  headerBackText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // ================= Tela Início =================
  inicioContainer: {
    flex: 1,
    backgroundColor: '#1A0404',
  },
  inicioBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inicioOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 3, 3, 0.45)',
  },
  inicioContent: {
    paddingHorizontal: 28,
    alignItems: 'center',
    zIndex: 2,
    maxWidth: 680,
  },
  inicioTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 14,
    ...Platform.select({
      web: {
        textShadow: '0px 2px 6px rgba(0, 0, 0, 0.75)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
      },
    }),
  },
  inicioSubtitle: {
    fontSize: 16,
    color: '#F3F4F6',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
    ...Platform.select({
      web: {
        textShadow: '0px 1px 4px rgba(0, 0, 0, 0.85)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.85)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
    }),
  },

  // ================= Tela Catálogo =================
  catalogoContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  catalogoScroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 90,
  },
  catalogoTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  catalogoSubtitle: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 20,
  },
  wineCard: {
    backgroundColor: '#C49E93',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  wineImageWrapper: {
    width: 60,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  wineImage: {
    width: 55,
    height: 115,
  },
  wineDetails: {
    flex: 1,
  },
  wineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  wineDescription: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 17,
  },

  // ================= Tela Contato =================
  contatoContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contatoScroll: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 90,
  },
  contatoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
    lineHeight: 28,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      },
    }),
  },
  contactIcon: {
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
    color: '#4B5563',
  },

  // ================= Bottom Tab Bar =================
  bottomBarWrapper: {
    backgroundColor: '#400303',
    width: '100%',
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    height: 58,
    backgroundColor: '#400303',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    maxWidth: 600,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
  },
  tabLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 3,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontSize: 11,
    color: '#400303',
    marginTop: 3,
    fontWeight: 'bold',
  },
});
