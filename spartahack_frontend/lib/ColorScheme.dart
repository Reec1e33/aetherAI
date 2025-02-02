import 'package:flutter/material.dart';

class CustomColorScheme {
  /// Main Colors
  static Color white = const Color(0xffFFFFFF);
  static Color offWhite = const Color(0xffF2F2F2);
  static Color gray = const Color(0xff696969);
  static Color lightGray = const Color(0xffC1C1C1);
  static Color mediumGray = const Color(0xff808080);
  static Color darkGray = const Color(0xff9A9999);
  static Color veryDarkGray = const Color(0xff323232);
  static Color black = const Color(0xff000000);

  /// This color exists because for some reason, if a container doesn't have color,
  /// that part of the container won't register touches
  static Color gestureTarget = Colors.transparent;

  /// Card Color
  static Color cardColorWhite = const Color(0xffFAFAFA);
  static Color cardColorBlack = const Color(0xff000000);
  static Color cardShadowColor = const Color(0xff7090B0).withOpacity(0.15);
}