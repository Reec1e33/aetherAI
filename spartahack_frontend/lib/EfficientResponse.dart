class EfficientResponse {
  EfficientResponse({
    required this.originalQuery,
    required this.originalResponse,
    required this.refinedQuery,
    required this.refinedResponse,
    required this.timeSaved,
  });

  String originalQuery;
  String originalResponse;
  String refinedQuery;
  String refinedResponse;
  String timeSaved;
}
