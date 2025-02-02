import 'package:dio/dio.dart';

class API {
  final Dio _dio = Dio();

  /// Sends a POST request to the API with the user's query.
  /// Returns a Map of type [String, String] if successful, or null on failure.
  Future<Map<String, String>?> refineQuery(String query) async {
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

      // Dio automatically decodes the JSON response if 'application/json' is returned.
      final data = response.data;

      // Ensure the response data is a Map before casting.
      if (data is Map<String, dynamic>) {
        // Convert all values to string to get a Map<String, String>.
        final result =
            data.map((key, value) => MapEntry(key, value.toString()));
        return result;
      } else {
        // If it's not the expected JSON map structure, return null or handle error.
        return null;
      }
    } on DioException catch (e) {
      print('DioError: $e');
      return null;
    } catch (e) {
      print('Unexpected error: $e');
      return null;
    }
  }
}
