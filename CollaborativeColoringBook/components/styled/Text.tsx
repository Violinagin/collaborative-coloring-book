// components/styled/Text.tsx
import styled from '@emotion/native';
import { useTheme } from '../../context/ThemeContext';

export const Heading = styled.Text(({ theme }) => ({
  fontSize: theme.typography.heading.fontSize,
  fontWeight: theme.typography.heading.fontWeight,
  lineHeight: theme.typography.heading.lineHeight,
  color: theme.colorRoles.ui.text.primary,
}));

export const Body = styled.Text(({ theme }) => ({
  fontSize: theme.typography.body.fontSize,
  fontWeight: theme.typography.body.fontWeight,
  lineHeight: theme.typography.body.lineHeight,
  color: theme.colorRoles.ui.text.primary,
}));

export const Caption = styled.Text(({ theme }) => ({
  fontSize: theme.typography.caption.fontSize,
  fontWeight: theme.typography.caption.fontWeight,
  lineHeight: theme.typography.caption.lineHeight,
  color: theme.colorRoles.ui.text.secondary,
}));
