import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { PizzariaTopShell } from '../../components/pizzariatop/PizzariaTopChrome';
import {
  MESAS_DISPONIVEIS_LAYOUT,
  MesaLayoutInfo,
  usePizzariaTop,
} from '../../components/pizzariatop/PizzariaTopContext';
import { FeedbackBanner, FeedbackType } from '../../components/pizzariatop/FeedbackBanner';
import { createShadow, useResponsive } from '../../hooks/useResponsive';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';

const HORARIOS_DISPONIVEIS = ['18:30', '19:30', '20:00', '21:00', '22:00'] as const;

const OCASIOES_DISPONIVEIS = [
  'Jantar em Família',
  'Encontro Romântico',
  'Aniversário 🎂',
  'Confraternização',
] as const;

const AMBIENTES_FILTRO = [
  'Todos',
  'Salão Principal',
  'Varanda Gourmet',
  'Área VIP',
] as const;

type AmbienteFiltro = (typeof AMBIENTES_FILTRO)[number];

interface DateChipOption {
  dateStr: string;
  shortDate: string;
  weekdayLabel: string;
}

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function buildNextFiveDays(): DateChipOption[] {
  const result: DateChipOption[] = [];
  const base = new Date();
  for (let i = 0; i < 5; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const weekdayLabel =
      i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : WEEKDAY_NAMES[d.getDay()];
    result.push({
      dateStr: `${dd}/${mm}/${yyyy}`,
      shortDate: `${dd}/${mm}`,
      weekdayLabel,
    });
  }
  return result;
}

function matchesAmbiente(
  mesaAmbiente: MesaLayoutInfo['ambiente'],
  filtro: AmbienteFiltro
): boolean {
  if (filtro === 'Todos') return true;
  if (filtro === 'Salão Principal') return mesaAmbiente.includes('Salão');
  if (filtro === 'Varanda Gourmet') return mesaAmbiente === 'Varanda Gourmet';
  if (filtro === 'Área VIP') return mesaAmbiente.includes('Área VIP');
  return true;
}

function getAmbienteDisplay(ambiente: string): string {
  if (ambiente.includes('Salão')) return 'Salão Principal · Forno a Lenha';
  if (ambiente.includes('Área VIP')) return 'Área VIP Climatizada';
  return ambiente;
}

function getAmbienteBadgeIcon(ambiente: string): keyof typeof Feather.glyphMap {
  if (ambiente.includes('Salão')) return 'zap';
  if (ambiente.includes('Varanda')) return 'wind';
  return 'star';
}

export default function ReservasScreen() {
  const { width } = useResponsive();
  const { user, reservas, mesasOcupadas, addReserva, cancelReserva } = usePizzariaTop();

  const dateOptions = useMemo(() => buildNextFiveDays(), []);

  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0]?.dateStr ?? '');
  const [selectedHorario, setSelectedHorario] = useState<string>('20:00');
  const [selectedOcasiao, setSelectedOcasiao] = useState<string>('Jantar em Família');
  const [ambienteFiltro, setAmbienteFiltro] = useState<AmbienteFiltro>('Todos');
  const [selectedMesaNum, setSelectedMesaNum] = useState<number | null>(null);
  const [nomeResponsavel, setNomeResponsavel] = useState<string>(user?.nome ?? '');
  const [feedback, setFeedback] = useState<{ type: FeedbackType; message: string } | null>(
    null
  );

  useEffect(() => {
    if (user?.nome && !nomeResponsavel.trim()) {
      setNomeResponsavel(user.nome);
    }
  }, [user?.nome, nomeResponsavel]);

  const mesasFiltradas = useMemo(
    () =>
      MESAS_DISPONIVEIS_LAYOUT.filter((m) => matchesAmbiente(m.ambiente, ambienteFiltro)),
    [ambienteFiltro]
  );

  const selectedMesaInfo = useMemo(
    () => MESAS_DISPONIVEIS_LAYOUT.find((m) => m.mesa === selectedMesaNum) ?? null,
    [selectedMesaNum]
  );

  useEffect(() => {
    if (selectedMesaNum && mesasOcupadas.includes(selectedMesaNum)) {
      setSelectedMesaNum(null);
    }
  }, [mesasOcupadas, selectedMesaNum]);

  const totalLivres = useMemo(
    () => MESAS_DISPONIVEIS_LAYOUT.filter((m) => !mesasOcupadas.includes(m.mesa)).length,
    [mesasOcupadas]
  );

  const mesaCardWidth =
    width >= 860 ? '23.6%' : width >= 540 ? '31.6%' : '48.2%';

  const handleSelectMesa = (mesaInfo: MesaLayoutInfo) => {
    const isOcupada = mesasOcupadas.includes(mesaInfo.mesa);
    if (isOcupada) {
      setFeedback({
        type: 'info',
        message: `A Mesa #${String(mesaInfo.mesa).padStart(2, '0')} já está ocupada/reservada neste turno. Escolha uma mesa livre.`,
      });
      return;
    }
    setFeedback(null);
    setSelectedMesaNum((prev) => (prev === mesaInfo.mesa ? null : mesaInfo.mesa));
  };

  const handleConfirmarReserva = () => {
    if (!selectedMesaInfo) {
      setFeedback({
        type: 'error',
        message: 'Selecione uma mesa livre na planta interativa antes de confirmar.',
      });
      return;
    }
    if (mesasOcupadas.includes(selectedMesaInfo.mesa)) {
      setFeedback({
        type: 'error',
        message: 'Esta mesa acabou de ser ocupada. Selecione outra mesa disponível.',
      });
      setSelectedMesaNum(null);
      return;
    }
    const cleanNome = nomeResponsavel.trim();
    if (cleanNome.length < 2) {
      setFeedback({
        type: 'error',
        message: 'Informe o nome do responsável pela reserva (mínimo 2 letras).',
      });
      return;
    }

    const nova = addReserva({
      mesa: selectedMesaInfo.mesa,
      lugares: selectedMesaInfo.lugares,
      ambiente: getAmbienteDisplay(selectedMesaInfo.ambiente),
      data: selectedDate,
      horario: selectedHorario,
      cliente: cleanNome,
      ocasiao: selectedOcasiao,
    });

    setSelectedMesaNum(null);
    setFeedback({
      type: 'success',
      message: `Reserva confirmada! Mesa #${String(nova.mesa).padStart(2, '0')} (${nova.lugares} lugares) em ${nova.data} às ${nova.horario} para ${nova.cliente}.`,
    });
  };

  const handleCancelarReserva = (id: string, mesa: number) => {
    cancelReserva(id);
    setFeedback({
      type: 'info',
      message: `Reserva da Mesa #${String(mesa).padStart(2, '0')} cancelada. A mesa voltou a ficar livre na planta!`,
    });
  };

  return (
    <PizzariaTopShell
      activeTab="reservas"
      subtitle="Salão & Varanda · Reserva de Mesas"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.maxWidthWrap}>
          {/* Hero Cabeçalho da Reserva */}
          <View style={localStyles.heroBanner}>
            <View style={localStyles.heroGlowOrb} />
            <View style={localStyles.heroTopRow}>
              <View style={localStyles.heroPill}>
                <Feather name="calendar" size={12} color="#FACC15" />
                <Text style={localStyles.heroPillText}>EXPERIÊNCIA PRESENCIAL</Text>
              </View>
              <View style={localStyles.liveAvailabilityBadge}>
                <View style={localStyles.greenDot} />
                <Text style={localStyles.liveAvailabilityText}>
                  {totalLivres} de {MESAS_DISPONIVEIS_LAYOUT.length} mesas livres
                </Text>
              </View>
            </View>

            <Text style={localStyles.heroTitle}>Reserva de Mesas</Text>
            <Text style={localStyles.heroSub}>
              Escolha data, horário, ocasião e toque na mesa desejada na planta interativa do
              Salão Forno a Lenha, Varanda Gourmet ou Área VIP.
            </Text>
          </View>

          {feedback ? (
            <FeedbackBanner
              type={feedback.type}
              message={feedback.message}
              onDismiss={() => setFeedback(null)}
            />
          ) : null}

          {/* Seletores de Data, Horário e Ocasião */}
          <View style={styles.glassCard}>
            <Text style={localStyles.selectorLabel}>
              1. Escolha a Data (Próximos 5 dias)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={localStyles.chipsRow}
            >
              {dateOptions.map((opt) => {
                const active = selectedDate === opt.dateStr;
                return (
                  <TouchableOpacity
                    key={opt.dateStr}
                    style={[
                      localStyles.dateChip,
                      active && localStyles.dateChipActive,
                    ]}
                    onPress={() => setSelectedDate(opt.dateStr)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        localStyles.dateChipWeekday,
                        active && localStyles.dateChipTextDark,
                      ]}
                    >
                      {opt.weekdayLabel}
                    </Text>
                    <Text
                      style={[
                        localStyles.dateChipDay,
                        active && localStyles.dateChipTextDark,
                      ]}
                    >
                      {opt.shortDate}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[localStyles.selectorLabel, { marginTop: 14 }]}>
              2. Horário da Chegada
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={localStyles.chipsRow}
            >
              {HORARIOS_DISPONIVEIS.map((hora) => {
                const active = selectedHorario === hora;
                return (
                  <TouchableOpacity
                    key={hora}
                    style={[
                      localStyles.optionChip,
                      active && localStyles.optionChipGold,
                    ]}
                    onPress={() => setSelectedHorario(hora)}
                    activeOpacity={0.8}
                  >
                    <Feather
                      name="clock"
                      size={13}
                      color={active ? '#111827' : '#FACC15'}
                    />
                    <Text
                      style={[
                        localStyles.optionChipText,
                        active && localStyles.optionChipTextGold,
                      ]}
                    >
                      {hora}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[localStyles.selectorLabel, { marginTop: 14 }]}>
              3. Ocasião Especial
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={localStyles.chipsRow}
            >
              {OCASIOES_DISPONIVEIS.map((ocasiao) => {
                const active = selectedOcasiao === ocasiao;
                return (
                  <TouchableOpacity
                    key={ocasiao}
                    style={[
                      localStyles.optionChip,
                      active && localStyles.optionChipFire,
                    ]}
                    onPress={() => setSelectedOcasiao(ocasiao)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        localStyles.optionChipText,
                        active && { color: '#FFFFFF', fontWeight: '800' },
                      ]}
                    >
                      {ocasiao}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Filtro de Ambiente + Planta Interativa das 12 Mesas */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Planta Interativa das 12 Mesas</Text>
            </View>
            <Text style={styles.sectionMeta}>{mesasFiltradas.length} exibida(s)</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.filterChipRow, { marginBottom: 6 }]}
          >
            {AMBIENTES_FILTRO.map((amb) => {
              const active = ambienteFiltro === amb;
              return (
                <TouchableOpacity
                  key={amb}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setAmbienteFiltro(amb)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {amb}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={localStyles.floorPlanContainer}>
            {/* Barra arquitetônica Forno a Lenha + Legenda */}
            <View style={localStyles.floorPlanHeader}>
              <View style={styles.rowGap}>
                <View style={localStyles.ovenIconCircle}>
                  <FontAwesome5 name="fire" size={14} color="#FACC15" />
                </View>
                <View>
                  <Text style={localStyles.floorPlanStageTitle}>
                    Forno a Lenha Central & Varanda
                  </Text>
                  <Text style={localStyles.floorPlanStageSub}>
                    Toque em uma mesa livre para selecioná-la
                  </Text>
                </View>
              </View>

              <View style={localStyles.legendWrap}>
                <View style={localStyles.legendItem}>
                  <View
                    style={[
                      localStyles.legendSwatch,
                      {
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        borderColor: 'rgba(255,255,255,0.28)',
                      },
                    ]}
                  />
                  <Text style={localStyles.legendText}>Livre</Text>
                </View>
                <View style={localStyles.legendItem}>
                  <View
                    style={[
                      localStyles.legendSwatch,
                      { backgroundColor: '#FACC15', borderColor: '#FEF08A' },
                    ]}
                  />
                  <Text style={localStyles.legendText}>Selecionada</Text>
                </View>
                <View style={localStyles.legendItem}>
                  <View
                    style={[
                      localStyles.legendSwatch,
                      {
                        backgroundColor: 'rgba(239, 68, 68, 0.28)',
                        borderColor: '#EF4444',
                      },
                    ]}
                  />
                  <Text style={localStyles.legendText}>Ocupada</Text>
                </View>
              </View>
            </View>

            {/* Grid das Mesas */}
            <View style={localStyles.mesasGrid}>
              {mesasFiltradas.map((mesaInfo) => {
                const isOcupada = mesasOcupadas.includes(mesaInfo.mesa);
                const isSelected = selectedMesaNum === mesaInfo.mesa && !isOcupada;
                const ambIcon = getAmbienteBadgeIcon(mesaInfo.ambiente);

                return (
                  <TouchableOpacity
                    key={mesaInfo.mesa}
                    style={[
                      localStyles.mesaCard,
                      { width: mesaCardWidth as any },
                      isOcupada && localStyles.mesaCardOcupada,
                      isSelected && localStyles.mesaCardSelecionada,
                    ]}
                    onPress={() => handleSelectMesa(mesaInfo)}
                    activeOpacity={isOcupada ? 0.9 : 0.78}
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: isOcupada,
                      selected: isSelected,
                    }}
                  >
                    <View style={localStyles.mesaCardTopRow}>
                      <Text
                        style={[
                          localStyles.mesaNumberText,
                          isOcupada && { color: '#FCA5A5' },
                          isSelected && { color: '#111827' },
                        ]}
                      >
                        Mesa #{String(mesaInfo.mesa).padStart(2, '0')}
                      </Text>
                      <View
                        style={[
                          localStyles.mesaStatusPill,
                          isOcupada
                            ? localStyles.mesaStatusPillOcupada
                            : isSelected
                            ? localStyles.mesaStatusPillSelected
                            : localStyles.mesaStatusPillLivre,
                        ]}
                      >
                        <Text
                          style={[
                            localStyles.mesaStatusText,
                            isOcupada && { color: '#FECACA' },
                            isSelected && { color: '#FACC15' },
                          ]}
                        >
                          {isOcupada ? 'Ocupada' : isSelected ? 'Escolhida' : 'Livre'}
                        </Text>
                      </View>
                    </View>

                    {/* Indicador visual de cadeiras / lugares */}
                    <View style={localStyles.seatsRow}>
                      <Feather
                        name="users"
                        size={14}
                        color={
                          isSelected
                            ? '#111827'
                            : isOcupada
                            ? '#EF4444'
                            : PIZZARIA_COLORS.gold
                        }
                      />
                      <Text
                        style={[
                          localStyles.seatsText,
                          isOcupada && { color: '#FCA5A5' },
                          isSelected && { color: '#111827' },
                        ]}
                      >
                        {mesaInfo.lugares} lugares
                      </Text>
                      <View style={localStyles.seatDotsGroup}>
                        {Array.from({ length: mesaInfo.lugares }).map((_, idx) => (
                          <View
                            key={`chair-${mesaInfo.mesa}-${idx}`}
                            style={[
                              localStyles.seatDot,
                              isOcupada && { backgroundColor: '#EF4444' },
                              isSelected && { backgroundColor: '#111827' },
                            ]}
                          />
                        ))}
                      </View>
                    </View>

                    <View style={localStyles.mesaAmbienteRow}>
                      <Feather
                        name={ambIcon}
                        size={11}
                        color={
                          isSelected
                            ? '#1F2937'
                            : isOcupada
                            ? '#FCA5A5'
                            : PIZZARIA_COLORS.textMuted
                        }
                      />
                      <Text
                        style={[
                          localStyles.mesaAmbienteText,
                          isOcupada && { color: '#FCA5A5' },
                          isSelected && { color: '#1F2937', fontWeight: '700' },
                        ]}
                        numberOfLines={1}
                      >
                        {getAmbienteDisplay(mesaInfo.ambiente)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Formulário Rápido de Confirmação */}
          <View style={[styles.glassCard, styles.glassCardGold]}>
            <View style={[styles.rowGap, { justifyContent: 'space-between', marginBottom: 10 }]}>
              <View style={styles.rowGap}>
                <Feather name="check-square" size={17} color="#FACC15" />
                <Text style={styles.itemTitle}>Finalizar Reserva</Text>
              </View>
              {selectedMesaInfo ? (
                <View style={localStyles.selectedSummaryBadge}>
                  <Text style={localStyles.selectedSummaryBadgeText}>
                    Mesa #{String(selectedMesaInfo.mesa).padStart(2, '0')} · {selectedMesaInfo.lugares} lug.
                  </Text>
                </View>
              ) : (
                <Text style={styles.sectionMeta}>Nenhuma mesa marcada</Text>
              )}
            </View>

            <View style={localStyles.summaryStrip}>
              <View style={localStyles.summaryStripItem}>
                <Feather name="calendar" size={13} color="#FACC15" />
                <Text style={localStyles.summaryStripText}>
                  {selectedDate} às {selectedHorario}
                </Text>
              </View>
              <View style={localStyles.summaryStripItem}>
                <Feather name="heart" size={13} color="#FF8C42" />
                <Text style={localStyles.summaryStripText}>{selectedOcasiao}</Text>
              </View>
              {selectedMesaInfo ? (
                <View style={localStyles.summaryStripItem}>
                  <Feather name="map-pin" size={13} color="#10B981" />
                  <Text style={localStyles.summaryStripText}>
                    {getAmbienteDisplay(selectedMesaInfo.ambiente)}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.inputLabel}>Nome do Responsável</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: Ana Paula Oliveira"
              placeholderTextColor={PIZZARIA_COLORS.textMuted}
              value={nomeResponsavel}
              onChangeText={setNomeResponsavel}
            />

            <TouchableOpacity
              style={[
                styles.goldCtaBtn,
                !selectedMesaInfo && { opacity: 0.78 },
              ]}
              onPress={handleConfirmarReserva}
              activeOpacity={0.85}
            >
              <Feather name="check-circle" size={16} color="#111827" />
              <Text style={styles.goldCtaText}>Confirmar Reserva</Text>
            </TouchableOpacity>
          </View>

          {/* Lista Minhas Reservas Confirmadas */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionDot, { backgroundColor: PIZZARIA_COLORS.emerald }]} />
              <Text style={styles.sectionTitle}>Minhas Reservas Confirmadas</Text>
            </View>
            <Text style={styles.sectionMeta}>{reservas.length} ativa(s)</Text>
          </View>

          {reservas.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyStateIconBox}>
                <Feather name="calendar" size={22} color={PIZZARIA_COLORS.gold} />
              </View>
              <Text style={styles.emptyStateTitle}>Nenhuma reserva ativa</Text>
              <Text style={styles.emptyStateDesc}>
                Selecione uma mesa livre acima e toque em &quot;Confirmar Reserva&quot; para garantir
                seu lugar na Pizzaria TOP.
              </Text>
            </View>
          ) : (
            reservas.map((res) => (
              <View key={res.id} style={styles.crudCard}>
                <View style={styles.crudCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.rowGap, { marginBottom: 4 }]}>
                      <View style={localStyles.confirmedBadge}>
                        <Feather name="check" size={11} color="#10B981" />
                        <Text style={localStyles.confirmedBadgeText}>CONFIRMADA</Text>
                      </View>
                      <Text style={localStyles.reservaMesaTitle}>
                        Mesa #{String(res.mesa).padStart(2, '0')} · {res.lugares} lugares
                      </Text>
                    </View>
                    <Text style={styles.itemTitle}>{res.cliente}</Text>
                    <Text style={styles.itemDesc}>{res.ambiente}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteActionBtn}
                    onPress={() => handleCancelarReserva(res.id, res.mesa)}
                    activeOpacity={0.8}
                  >
                    <Feather name="x-circle" size={13} color="#FCA5A5" />
                    <Text style={styles.deleteActionText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.crudMetaRow}>
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>📅 {res.data}</Text>
                  </View>
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>🕗 {res.horario}</Text>
                  </View>
                  {res.ocasiao ? (
                    <View style={styles.tagPill}>
                      <Text style={styles.tagPillText}>✨ {res.ocasiao}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </PizzariaTopShell>
  );
}

const goldGlow = createShadow({
  color: '#FACC15',
  offset: { width: 0, height: 4 },
  opacity: 0.35,
  radius: 12,
  elevation: 6,
});

const localStyles = StyleSheet.create({
  heroBanner: {
    backgroundColor: '#131C31',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(250, 204, 21, 0.38)',
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 10px 28px rgba(0, 0, 0, 0.45)' },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  heroGlowOrb: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
  },
  heroTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 204, 21, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.45)',
  },
  heroPillText: {
    color: '#FEF08A',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  liveAvailabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveAvailabilityText: {
    color: '#A7F3D0',
    fontSize: 11.5,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#FACC15',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 5,
  },
  heroSub: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  selectorLabel: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  dateChip: {
    minWidth: 74,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
  },
  dateChipActive: {
    backgroundColor: '#FACC15',
    borderColor: '#FEF08A',
    ...goldGlow,
  },
  dateChipWeekday: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  dateChipDay: {
    color: PIZZARIA_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  dateChipTextDark: {
    color: '#111827',
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  optionChipGold: {
    backgroundColor: '#FACC15',
    borderColor: '#FEF08A',
  },
  optionChipFire: {
    backgroundColor: PIZZARIA_COLORS.fireOrange,
    borderColor: '#FF8C42',
  },
  optionChipText: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  optionChipTextGold: {
    color: '#111827',
    fontWeight: '900',
  },
  floorPlanContainer: {
    backgroundColor: '#131926',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    padding: 14,
    marginBottom: 14,
  },
  floorPlanHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.09)',
  },
  ovenIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floorPlanStageTitle: {
    color: PIZZARIA_COLORS.textPrimary,
    fontSize: 13.5,
    fontWeight: '800',
  },
  floorPlanStageSub: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 11.5,
  },
  legendWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  legendText: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  mesasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  mesaCard: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'space-between',
    minHeight: 108,
  },
  mesaCardOcupada: {
    backgroundColor: 'rgba(239, 68, 68, 0.20)',
    borderColor: '#EF4444',
  },
  mesaCardSelecionada: {
    backgroundColor: '#FACC15',
    borderColor: '#FEF08A',
    ...goldGlow,
  },
  mesaCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 8,
  },
  mesaNumberText: {
    color: PIZZARIA_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  mesaStatusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  mesaStatusPillLivre: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  mesaStatusPillOcupada: {
    backgroundColor: 'rgba(239, 68, 68, 0.28)',
    borderColor: '#EF4444',
  },
  mesaStatusPillSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  mesaStatusText: {
    color: '#6EE7B7',
    fontSize: 9.5,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  seatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 7,
  },
  seatsText: {
    color: PIZZARIA_COLORS.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  seatDotsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  seatDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(250, 204, 21, 0.65)',
  },
  mesaAmbienteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mesaAmbienteText: {
    flex: 1,
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  selectedSummaryBadge: {
    backgroundColor: '#FACC15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  selectedSummaryBadgeText: {
    color: '#111827',
    fontSize: 11.5,
    fontWeight: '900',
  },
  summaryStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryStripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  summaryStripText: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  confirmedBadgeText: {
    color: '#6EE7B7',
    fontSize: 10,
    fontWeight: '900',
  },
  reservaMesaTitle: {
    color: PIZZARIA_COLORS.gold,
    fontSize: 13,
    fontWeight: '900',
  },
});
