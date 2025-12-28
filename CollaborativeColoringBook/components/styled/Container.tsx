// components/styled/Container.tsx
import styled from '@emotion/native';

export const Container = styled.View(({ theme }) => ({
  flex: 1,
  backgroundColor: theme.colorRoles.ui.background,
}));