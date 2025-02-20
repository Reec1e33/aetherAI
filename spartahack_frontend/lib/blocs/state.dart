part of 'bloc.dart';

sealed class AppScreensState {
  const AppScreensState();
}

final class AppScreensStateInitial extends AppScreensState {
  const AppScreensStateInitial();
}

final class AppScreensStateLoading extends AppScreensState {
  const AppScreensStateLoading();
}

final class AppScreensStateLoaded extends AppScreensState {
  final EfficientResponse response;

  const AppScreensStateLoaded(this.response);
}

final class AppScreensStateError extends AppScreensState {
  final String message;

  const AppScreensStateError(this.message);
}
