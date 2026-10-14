import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 32,
  },
  contentCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  wrapperMaxWidth: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },

  // Tela 1 - Home
  homeTitle: {
    fontSize: 28,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  homeSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 40,
  },

  // Tela 2 - Cardápio
  cardapioList: {
    flex: 1,
    paddingTop: 16,
  },
  cardapioHeader: {
    marginBottom: 16,
  },
  cardapioTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardapioSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  itemCard: {
    backgroundColor: '#EEF2F6',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemNome: {
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#0F172A',
    marginBottom: 4,
  },
  itemPreco: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },

  // Tela 3 - Pedido
  okCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 20px rgba(34, 197, 94, 0.3)',
      },
      default: {
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  okText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  pedidoTitle: {
    fontSize: 26,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  pedidoSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 36,
  },

  // Botões
  buttonBlue: {
    backgroundColor: '#2B78E4',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 14px rgba(43, 120, 228, 0.25)',
      },
      default: {
        shadowColor: '#2B78E4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  buttonBlueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDark: {
    backgroundColor: '#334155',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 14px rgba(51, 65, 85, 0.2)',
      },
      default: {
        shadowColor: '#334155',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  buttonDarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  hubHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  hubHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
