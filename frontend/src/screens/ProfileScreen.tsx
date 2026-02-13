import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { IceBackground } from '@components/IceBackground';
import { ScreenHeader } from '@components/ScreenHeader';
import { spacing, radius, typography } from '../theme';
import { useThemeColors } from '@hooks/useThemeColors';
import { useAppStore, type AppMode, type FanBadge } from '@store/useAppStore';
import { nhlApi, fetchTodayGames, type NhlGame } from '@services/nhlApi';
import { fetchOlympicTeams, type OlympicTeam } from '@services/hockeyApi';
import type { RootTabParamList } from '../types/navigation';

type NhlTeam = { id: number; name: string; abbreviation: string; logo?: string };
type TeamsResponse = { teams: NhlTeam[] };

const FAN_BADGES: { key: FanBadge; label: string; icon: string }[] = [
  { key: 'rookie', label: 'Rookie Fan', icon: 'leaf' },
  { key: 'playoff', label: 'Playoff Fan', icon: 'trophy' },
  { key: 'hardcore', label: 'Hardcore Fan', icon: 'flame' },
  { key: 'olympic', label: 'Olympic Supporter', icon: 'medal' },
];

function getFanBadge(
  gamesWatched: number,
  newsRead: number,
  teamsFollowed: number,
  olympicFavs: number,
  mode: AppMode
): FanBadge {
  if (olympicFavs > 0 && mode === 'olympics') return 'olympic';
  if (gamesWatched >= 20 || newsRead >= 50) return 'hardcore';
  if (gamesWatched >= 5 || teamsFollowed >= 2) return 'playoff';
  return 'rookie';
}

function formatGameTime(gameDate: string): string {
  try {
    const d = new Date(gameDate);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList, 'Profile'>>();
  const colors = useThemeColors();
  const user = useAppStore(s => s.user);
  const mode = useAppStore(s => s.mode);
  const favoriteTeams = useAppStore(s => s.favoriteTeams);
  const favoriteOlympicTeams = useAppStore(s => s.favoriteOlympicTeams);
  const logout = useAppStore(s => s.logout);
  const notifyGames = useAppStore(s => s.notifyGames);
  const notifyNews = useAppStore(s => s.notifyNews);
  const notifyOlympics = useAppStore(s => s.notifyOlympics);
  const reminderBeforeGame = useAppStore(s => s.reminderBeforeGame);
  const setNotifyGames = useAppStore(s => s.setNotifyGames);
  const setNotifyNews = useAppStore(s => s.setNotifyNews);
  const setNotifyOlympics = useAppStore(s => s.setNotifyOlympics);
  const setReminderBeforeGame = useAppStore(s => s.setReminderBeforeGame);
  const darkMode = useAppStore(s => s.darkMode);
  const themeAuto = useAppStore(s => s.themeAuto);
  const animatedBackground = useAppStore(s => s.animatedBackground);
  const setDarkMode = useAppStore(s => s.setDarkMode);
  const setThemeAuto = useAppStore(s => s.setThemeAuto);
  const setAnimatedBackground = useAppStore(s => s.setAnimatedBackground);
  const gamesWatched = useAppStore(s => s.gamesWatched);
  const newsRead = useAppStore(s => s.newsRead);
  const wallpapersDownloaded = useAppStore(s => s.wallpapersDownloaded);

  const [nhlTeams, setNhlTeams] = useState<NhlTeam[]>([]);
  const [olympicTeams, setOlympicTeams] = useState<OlympicTeam[]>([]);
  const [nextGame, setNextGame] = useState<{ teamName: string; time: string } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loadTeams = useCallback(async () => {
    try {
      const [nhlRes, olympicList] = await Promise.all([
        favoriteTeams.length > 0
          ? nhlApi.get<TeamsResponse>('/teams').catch(() => ({ teams: [] }))
          : Promise.resolve({ teams: [] }),
        favoriteOlympicTeams.length > 0 ? fetchOlympicTeams('2026') : Promise.resolve([]),
      ]);
      const nhlList = (nhlRes as any)?.teams ?? (nhlRes as any)?.data?.teams ?? [];
      setNhlTeams(nhlList.filter((t: NhlTeam) => favoriteTeams.includes(t.id)));
      setOlympicTeams(olympicList.filter(t => favoriteOlympicTeams.includes(t.id)));
    } catch {
      setNhlTeams([]);
      setOlympicTeams([]);
    }
  }, [favoriteTeams.join(','), favoriteOlympicTeams.join(',')]);

  const loadNextGame = useCallback(async () => {
    if (favoriteTeams.length === 0) {
      setNextGame(null);
      return;
    }
    try {
      const games = await fetchTodayGames();
      const teamSet = new Set(favoriteTeams);
      const game = games.find(
        (g: NhlGame) =>
          teamSet.has(g.teams?.away?.team?.id) || teamSet.has(g.teams?.home?.team?.id)
      );
      if (!game) {
        setNextGame(null);
        return;
      }
      const homeId = game.teams?.home?.team?.id;
      const awayId = game.teams?.away?.team?.id;
      const teamName =
        teamSet.has(homeId) ? game.teams?.home?.team?.name : game.teams?.away?.team?.name;
      setNextGame({
        teamName: teamName ?? 'Time',
        time: formatGameTime(game.gameDate ?? ''),
      });
    } catch {
      setNextGame(null);
    }
  }, [favoriteTeams.join(',')]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);
  useEffect(() => {
    loadNextGame();
  }, [loadNextGame]);

  const mainTeamName = nhlTeams[0]?.name ?? (favoriteTeams.length > 0 ? 'Time favorito' : '—');
  const olympicLabel =
    olympicTeams.length > 0
      ? olympicTeams.map(t => t.name).join(', ')
      : favoriteOlympicTeams.length > 0
        ? 'Seleções favoritas'
        : '—';
  const displayName = user?.name?.trim() || 'Fã de Hockey';
  const displayEmail = user?.email || '';

  const badge = getFanBadge(
    gamesWatched,
    newsRead,
    favoriteTeams.length + favoriteOlympicTeams.length,
    favoriteOlympicTeams.length,
    mode
  );
  const badgeInfo = FAN_BADGES.find(b => b.key === badge);

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Sua conta e dados locais serão removidos. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => setShowPrivacyModal(true);

  const handleChangePasswordSubmit = () => {
    if (!newPassword.trim()) {
      Alert.alert('Atenção', 'Digite a nova senha.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Atenção', 'A confirmação da senha não confere.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    Alert.alert('Senha alterada', 'Em produção, a alteração seria enviada ao servidor. Por enquanto a preferência foi registrada.');
  };

  return (
    <IceBackground>
      <ScreenHeader
        title="Perfil"
        subtitle="Seu hub pessoal no IceHub"
        icon="person-outline"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xxl * 2 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Card do usuário (estilo player card) */}
        <View style={styles.cardWrap}>
          <LinearGradient
            colors={[colors.primarySoft, colors.surface, colors.surfaceCard]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.userCard, { borderColor: colors.borderLight }]}
          >
            <View style={styles.userCardInner}>
              <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
              {displayEmail ? (
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{displayEmail}</Text>
              ) : null}
              <View style={styles.userCardRow}>
                <Ionicons name="trophy-outline" size={14} color={colors.primary} />
                <Text style={[styles.userCardLabel, { color: colors.textSecondary }]}>
                  Time do coração: {mainTeamName}
                </Text>
              </View>
              <View style={styles.userCardRow}>
                <Ionicons name="globe-outline" size={14} color={colors.primary} />
                <Text style={[styles.userCardLabel, { color: colors.textSecondary }]}>
                  Olimpíadas: {olympicLabel}
                </Text>
              </View>
              <View style={styles.userCardRow}>
                <Ionicons name="game-controller-outline" size={14} color={colors.primary} />
                <Text style={[styles.userCardLabel, { color: colors.textSecondary }]}>
                  Modo padrão: {mode === 'nhl' ? 'NHL' : 'Olimpíadas'}
                </Text>
              </View>
              {badgeInfo && (
                <View style={[styles.badgeChip, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={badgeInfo.icon as any} size={14} color={colors.primary} />
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{badgeInfo.label}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Meus favoritos */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Meus favoritos</Text>
          {nhlTeams.length === 0 && olympicTeams.length === 0 ? (
            <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
              Nenhum favorito ainda. Toque abaixo para gerenciar.
            </Text>
          ) : (
            <>
              {nhlTeams.slice(0, 3).map(t => (
                <View
                  key={t.id}
                  style={[styles.favRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[styles.logoCircle, { backgroundColor: colors.primarySoft }]}>
                    <Text style={[styles.logoAbbr, { color: colors.primary }]}>{t.abbreviation}</Text>
                  </View>
                  <View style={styles.favTextCol}>
                    <Text style={[styles.favTeamName, { color: colors.text }]}>{t.name}</Text>
                    {nextGame && t.name === nextGame.teamName && (
                      <Text style={[styles.nextGame, { color: colors.primary }]}>
                        Próximo jogo hoje {nextGame.time}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
              {olympicTeams.slice(0, 2).map(t => (
                <View
                  key={t.id}
                  style={[styles.favRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[styles.logoCircle, { backgroundColor: colors.primarySoft }]}>
                    {t.logo ? (
                      <Image source={{ uri: t.logo }} style={styles.logoImg} />
                    ) : (
                      <Text style={[styles.logoAbbr, { color: colors.primary }]}>
                        {t.name?.slice(0, 2).toUpperCase() ?? '—'}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.favTeamName, { color: colors.text }]}>{t.name}</Text>
                </View>
              ))}
            </>
          )}
          <TouchableOpacity
            style={[styles.manageButton, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
            onPress={() => navigation.navigate('Favorites')}
          >
            <Ionicons name="star" size={18} color={colors.primary} />
            <Text style={[styles.manageButtonText, { color: colors.primary }]}>Gerenciar favoritos</Text>
          </TouchableOpacity>
        </View>

        {/* Notificações */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notificações</Text>
          <RowSwitch
            label="Avisar quando meu time jogar"
            value={notifyGames}
            onValueChange={setNotifyGames}
            colors={colors}
          />
          <RowSwitch
            label="Avisar notícias do meu time"
            value={notifyNews}
            onValueChange={setNotifyNews}
            colors={colors}
          />
          <RowSwitch
            label="Avisar jogos olímpicos"
            value={notifyOlympics}
            onValueChange={setNotifyOlympics}
            colors={colors}
          />
          <RowSwitch
            label="Lembrete 30 min antes do jogo"
            value={reminderBeforeGame}
            onValueChange={setReminderBeforeGame}
            colors={colors}
          />
        </View>

        {/* Aparência */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Aparência</Text>
          <RowSwitch
            label="Modo escuro"
            value={darkMode}
            onValueChange={setDarkMode}
            colors={colors}
          />
          <RowSwitch
            label="Tema NHL / Olimpíadas automático"
            value={themeAuto}
            onValueChange={setThemeAuto}
            colors={colors}
          />
          <RowSwitch
            label="Fundo animado"
            value={animatedBackground}
            onValueChange={setAnimatedBackground}
            colors={colors}
          />
        </View>

        {/* Minha temporada (estatísticas) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Minha temporada</Text>
          <View style={[styles.statsGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <StatItem colors={colors} value={gamesWatched} label="Jogos assistidos" />
            <StatItem colors={colors} value={favoriteTeams.length + favoriteOlympicTeams.length} label="Times seguidos" />
            <StatItem colors={colors} value={newsRead} label="Notícias lidas" />
            <StatItem colors={colors} value={wallpapersDownloaded} label="Wallpapers baixados" />
          </View>
        </View>

        {/* Conta e segurança */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Conta e segurança</Text>
          <TouchableOpacity
            style={[styles.menuRow, { borderColor: colors.border }]}
            onPress={() => setShowPasswordModal(true)}
          >
            <Ionicons name="key-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.menuRowText, { color: colors.text }]}>Alterar senha</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuRow, { borderColor: colors.border }]}
            onPress={() => setShowPrivacyModal(true)}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.menuRowText, { color: colors.text }]}>Política de privacidade</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuRow, styles.logoutRow, { borderColor: colors.border }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.accent} />
            <Text style={[styles.menuRowText, { color: colors.accent }]}>Sair da conta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuRow, { borderColor: colors.border }]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text style={[styles.menuRowText, { color: colors.danger }]}>Excluir conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Alterar senha */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.modalBox, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Alterar senha</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Senha atual"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Nova senha"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Confirmar nova senha"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                onPress={handleChangePasswordSubmit}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Alterar</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal Política de privacidade */}
      <Modal visible={showPrivacyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, styles.modalBoxLarge, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Política de privacidade</Text>
            <ScrollView style={styles.privacyScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
                IceHub – Política de Privacidade (resumo){'\n\n'}
                O IceHub coleta apenas os dados necessários para o funcionamento do app: e-mail e nome (quando você se cadastra), preferências de notificação e tema, e dados de uso (ex.: favoritos e estatísticas) armazenados no seu dispositivo.{'\n\n'}
                Não vendemos seus dados. Em produção, a alteração de senha e a exclusão de conta seriam processadas pelo servidor; as notificações push dependeriam do seu consentimento.{'\n\n'}
                Para dúvidas: contato@icehub.app (exemplo).
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary, marginTop: spacing.md }]}
              onPress={() => setShowPrivacyModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: '#fff' }]}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </IceBackground>
  );
};

function RowSwitch({
  label,
  value,
  onValueChange,
  colors,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={[styles.switchRow, { borderColor: colors.border }]}>
      <Text style={[styles.switchLabel, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primarySoft }}
        thumbColor={value ? colors.primary : colors.textSecondary}
      />
    </View>
  );
}

function StatItem({
  colors,
  value,
  label,
}: {
  colors: ReturnType<typeof useThemeColors>;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg },
  cardWrap: { marginBottom: spacing.xl },
  userCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  userCardInner: { padding: spacing.lg },
  userName: {
    ...typography.titleLarge,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  userCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  userCardLabel: {
    ...typography.body,
    flex: 1,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.subtitle,
    marginBottom: spacing.md,
  },
  sectionHint: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  logoAbbr: {
    ...typography.caption,
  },
  logoImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    resizeMode: 'contain',
  },
  favTextCol: { flex: 1 },
  favTeamName: {
    ...typography.body,
  },
  nextGame: {
    ...typography.caption,
    marginTop: 2,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  manageButtonText: {
    ...typography.subtitle,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
  },
  switchLabel: {
    ...typography.body,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  statItem: {
    minWidth: '45%',
  },
  statValue: {
    ...typography.titleLarge,
  },
  statLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  logoutRow: {
    borderBottomWidth: 0,
  },
  menuRowText: {
    ...typography.body,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  modalBoxLarge: {
    maxHeight: '80%',
  },
  modalTitle: {
    ...typography.title,
    marginBottom: spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    borderWidth: 0,
  },
  modalButtonText: {
    ...typography.subtitle,
  },
  privacyScroll: {
    maxHeight: 280,
  },
  privacyText: {
    ...typography.body,
    lineHeight: 22,
  },
});
