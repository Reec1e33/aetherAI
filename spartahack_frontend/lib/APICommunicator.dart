import 'package:dio/dio.dart';

class API {
  final Dio _dio = Dio();

  /// Sends a POST request to the API with the user's query.
  /// Returns the refined query if successful, or null on failure.
  Future<String?> refineQuery(String query) async {
    try {
      final response = await _dio.post(
        'https://api.aetherai.us/api/refine-query',
        data: {
          'query': query,
        },
        options: Options(
          headers: {
            'Content-Type': 'application/json',
          },
        ),
      );
      print(response.data);
      return response.data; // Returns refined query
    } on DioException catch (e) {
      print('DioError: ${e}');
      return null;
    } catch (e) {
      print('Unexpected error: $e');
      return null;
    }
  }
}
