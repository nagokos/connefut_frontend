import { memo, useEffect, VFC } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { SubmitHandler, useForm } from 'react-hook-form';
import { GraphQLError } from 'graphql';
import { useSetRecoilState } from 'recoil';
import { yupResolver } from '@hookform/resolvers/yup';

import { useSize } from '../../hooks';
import { LoginUserInput, useGetCurrentUserQuery, useLoginUserMutation } from '../../generated/graphql';
import { flashMessage, flashState, flashType } from '../../store/flash';
import { LoginFormEmail, LoginFormPassword } from '../index';
import { loginSchema } from '../../yup/userSchema';

type Props = {
  open: boolean;
  handleClose: () => void;
};

export const LoginDialog: VFC<Props> = memo((props) => {
  const { open, handleClose } = props;
  const { isMobile } = useSize();

  const [result, userLogin] = useLoginUserMutation();

  const [, executeQuery] = useGetCurrentUserQuery();

  const navigate = useNavigate();

  const setState = useSetRecoilState(flashState);
  const setMessage = useSetRecoilState(flashMessage);
  const setType = useSetRecoilState(flashType);

  const { control, handleSubmit, reset, setError } = useForm<LoginUserInput>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    reset();
  }, [handleClose]);

  const onSubmit: SubmitHandler<LoginUserInput> = async (userData: LoginUserInput) => {
    const variables = { email: userData.email, password: userData.password };
    const res = await userLogin(variables);

    if (res.error) {
      res.error.graphQLErrors?.forEach((error: GraphQLError) => {
        if (error.extensions) {
          setError(error.extensions['attribute'] as 'email' | 'password', {
            message: error.message,
          });
          setState(true);
          setMessage(error.message);
          setType('error');
        } else {
          console.log('hello');
        }
      });
    } else {
      executeQuery({
        requestPolicy: 'network-only',
      });
      setState(true);
      setMessage('ログインしました');
      setType('success');
      handleClose();
      navigate('/');
    }
  };

  return (
    <Dialog
      PaperProps={{
        sx: {
          maxWidth: 400,
          borderRadius: isMobile ? 0 : 2,
          boxShadow: '0 5px 20px #00166721;',
        },
      }}
      BackdropProps={{
        sx: {
          bgcolor: 'rgba(38, 50, 56, 0.25);',
        },
      }}
      fullScreen={isMobile}
      open={open}
      onClose={handleClose}
    >
      <DialogTitle sx={{ fontWeight: 'bold', fontSize: 18, mt: 2.4, mr: 'auto', ml: 'auto' }}>
        <IconButton
          disableTouchRipple
          size="small"
          onClick={handleClose}
          sx={{ position: 'absolute', left: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
        メールアドレスでログイン
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ px: 3.3, pt: 2 }}>
          <Grid spacing={{ xs: 1.8, sm: 1.8, md: 1.8 }} container>
            <Grid item xs={12} md={12}>
              <LoginFormEmail control={control} />
            </Grid>
            <Grid item xs={12} md={12}>
              <LoginFormPassword control={control} />
            </Grid>
            <Grid item xs={12} md={12} mb={1.2} sx={{ mt: 1 }}>
              <Button
                disableRipple
                size="large"
                disableElevation
                sx={{ fontSize: 13, pt: 1.4, pb: 1.4 }}
                fullWidth
                variant="contained"
                type="submit"
              >
                ログイン
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </form>
    </Dialog>
  );
});
