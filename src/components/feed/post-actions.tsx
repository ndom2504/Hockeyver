import { Modal, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable';
import { colors, radius } from '@/constants/theme';
import { REPORT_REASONS } from '@/features/moderation/reasons';
import { CURRENT_USER_ID } from '@/constants/session';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useToastStore } from '@/store/useToastStore';
import type { ReportReason } from '@/types/social';

type Props = {
  postId: string;
  visible: boolean;
  onClose: () => void;
};

export function PostActions({ postId, visible, onClose }: Props) {
  const post = useCommunityStore((state) => state.posts.find((item) => item.id === postId));
  const hidePost = useCommunityStore((state) => state.hidePost);
  const deletePost = useCommunityStore((state) => state.deletePost);
  const reportPost = useCommunityStore((state) => state.reportPost);
  const show = useToastStore((state) => state.show);
  const mine = post?.authorId === CURRENT_USER_ID;

  const close = () => onClose();

  const report = (reason: ReportReason) => {
    reportPost(postId, reason);
    show('Merci, notre équipe va examiner ce signalement.');
    close();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <PressableOpacity style={styles.backdrop} onPress={close}>
        <PressableOpacity style={styles.sheet} onPress={() => undefined}>
          <View style={styles.handle} />
          <AppText variant="title3">Publication</AppText>
          {mine ? (
            <Action
              icon="trash"
              label="Supprimer"
              danger
              onPress={() => {
                deletePost(postId);
                show('Publication supprimée');
                close();
              }}
            />
          ) : (
            <>
              <Action
                icon="hide"
                label="Masquer"
                onPress={() => {
                  hidePost(postId);
                  show('Publication masquée');
                  close();
                }}
              />
              <AppText variant="label" color={colors.muted} style={styles.reportLabel}>
                Signaler
              </AppText>
              {REPORT_REASONS.map((reason) => (
                <Action key={reason.id} icon="flag" label={reason.label} onPress={() => report(reason.id)} />
              ))}
            </>
          )}
          <Action icon="close" label="Fermer" onPress={close} />
        </PressableOpacity>
      </PressableOpacity>
    </Modal>
  );
}

function Action({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: 'trash' | 'hide' | 'flag' | 'close';
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const color = danger ? colors.red : colors.ink;
  return (
    <PressableOpacity accessibilityRole="button" onPress={onPress} style={styles.action}>
      <Icon name={icon} size={18} color={color} />
      <AppText variant="body" color={color}>
        {label}
      </AppText>
    </PressableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 4,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: 8,
  },
  reportLabel: {
    marginTop: 12,
    marginBottom: 4,
  },
  action: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
