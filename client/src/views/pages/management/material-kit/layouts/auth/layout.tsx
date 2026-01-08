import type { Breakpoint, CSSObject } from '@mui/material/styles';

import { merge } from 'es-toolkit';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

import { RouterLink } from '@root/views/pages/management/material-kit/routes/components';

import { Logo } from '@root/views/pages/management/material-kit/components/logo';

import { HeaderSection } from '../core/header-section';
import { LayoutSection } from '../core/layout-section';
import { MainSection } from '../core/main-section';
import { AuthContent } from './content';

import type { HeaderSectionProps } from '../core/header-section';
import type { LayoutSectionProps } from '../core/layout-section';
import type { MainSectionProps } from '../core/main-section';
import type { AuthContentProps } from './content';

// ----------------------------------------------------------------------

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children' | 'cssVars'>;

export type AuthLayoutProps = LayoutBaseProps & {
  layoutQuery?: Breakpoint;
  slotProps?: {
    header?: HeaderSectionProps;
    main?: MainSectionProps;
    content?: AuthContentProps;
  };
};

export function AuthLayout({ sx, cssVars, children, slotProps, layoutQuery = 'md' }: AuthLayoutProps) {
  const renderHeader = () => {
    const headerSlotProps: HeaderSectionProps['slotProps'] = { container: { maxWidth: false } };

    const headerSlots: HeaderSectionProps['slots'] = {
      topArea: (
        <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
          This is an info Alert.
        </Alert>
      ),
      leftArea: (
        <>
          {/** @slot Logo */}
          <Logo sx={{ pt: 2.5, px: 2.5 }} />
        </>
      ),
      rightArea: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
          {/** @slot Help link */}
          <Link href="#" component={RouterLink} color="inherit" sx={{ typography: 'subtitle2' }}>
            Need help?
          </Link>
        </Box>
      ),
    };

    return (
      <HeaderSection
        disableElevation
        layoutQuery={layoutQuery}
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
        sx={[{ position: { [layoutQuery]: 'fixed' } }, ...(Array.isArray(slotProps?.header?.sx) ? (slotProps?.header?.sx ?? []) : [slotProps?.header?.sx])]}
      />
    );
  };

  const renderFooter = () => null;

  const renderMain = () => (
    <MainSection
      {...slotProps?.main}
      sx={[
        (theme) => ({
          alignItems: 'center',
          p: theme.spacing(3, 2, 10, 2),
          [theme.breakpoints.up(layoutQuery)]: {
            justifyContent: 'center',
            p: theme.spacing(10, 0, 10, 0),
          },
        }),
        ...(Array.isArray(slotProps?.main?.sx) ? (slotProps?.main?.sx ?? []) : [slotProps?.main?.sx]),
      ]}
    >
      <AuthContent {...slotProps?.content}>{children}</AuthContent>
    </MainSection>
  );

  return (
    <LayoutSection
      /** **************************************
       * @Header
       *************************************** */
      headerSection={renderHeader()}
      /** **************************************
       * @Footer
       *************************************** */
      footerSection={renderFooter()}
      /** **************************************
       * @Styles
       *************************************** */
      cssVars={{ '--layout-auth-content-width': '420px', ...cssVars }}
      sx={[
        (theme) => ({
          position: 'relative',
          '&::before': backgroundStyles(),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {renderMain()}
    </LayoutSection>
  );
}

// ----------------------------------------------------------------------

const backgroundStyles = (): CSSObject => ({
  zIndex: 1,
  opacity: 0.24,
  width: '100%',
  height: '100%',
  content: "''",
  position: 'absolute',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center center',
  backgroundImage: 'url(/management/assets/background/overlay.jpg)',
});
