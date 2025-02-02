import 'package:bloc/bloc.dart';
import 'package:spartahack_frontend/EfficientResponse.dart';

import '../APICommunicator.dart';

part 'state.dart';

class AppScreensCubit extends Cubit<AppScreensState> {
  AppScreensCubit() : super(const AppScreensStateInitial());

  Future<void> request(String text) async {
    emit(const AppScreensStateLoading());

    API api = API();

    Map<String, String>? test = await api.refineQuery(text);

    emit(
      AppScreensStateLoaded(
        EfficientResponse(
          originalQuery: text,
          originalResponse: test!["original_response"]!,
          refinedQuery: test!["refined_query"]!,
          refinedResponse: test!["refined_response"]!,
          timeSaved: test!["time_saved"]!,
        ),
      ),
    );
  }
}
