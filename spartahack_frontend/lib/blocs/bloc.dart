import 'package:bloc/bloc.dart';

import '../APICommunicator.dart';

part 'state.dart';

class AppScreensCubit extends Cubit<AppScreensState> {
  AppScreensCubit() : super(const AppScreensStateInitial());

  Future<void> request(String text) async {
    emit(const AppScreensStateLoading());

    API api = API();

    await api.refineQuery(text);
  }
}
