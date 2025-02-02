import 'package:auto_size_text/auto_size_text.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:spartahack_frontend/ColorScheme.dart';
import 'package:spartahack_frontend/blocs/bloc.dart';

import 'EfficientResponse.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: <BlocProvider<dynamic>>[
        BlocProvider<AppScreensCubit>(
          create: (BuildContext context) => AppScreensCubit(),
        ),
      ],
      child: MaterialApp(
        title: 'SpartaHack Aether',
        debugShowCheckedModeBanner: false,
        home: const MyHomePage(title: 'SpartaHack Aether'),
      ),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      backgroundColor: CustomColorScheme.offWhite,
      body: ListView(
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.1,
          ),
          Heading(),
          BlocBuilder<AppScreensCubit, AppScreensState>(
            builder: (BuildContext context, AppScreensState state) {
              return switch (state) {
                // TODO: Handle this case.
                AppScreensStateInitial() => Container(
                    height: MediaQuery.of(context).size.height * 0.5,
                    child: Column(
                      children: [
                        Expanded(
                          child: Container(
                            color: CustomColorScheme.gestureTarget,
                          ),
                        ),
                        SizedBox(
                          height: MediaQuery.of(context).size.height * 0.075,
                        ),
                        SizedBox(
                          height: 50.0,
                          width: double.infinity,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Created by Tanzil Zubair Bin Zaman & Reece Owen Roskam',
                                style: GoogleFonts.josefinSans(
                                  fontStyle: FontStyle.italic,
                                  fontWeight: FontWeight.w300,
                                  color: CustomColorScheme.black,
                                ),
                              ),
                              SizedBox(
                                height: 10,
                              ),
                              Text(
                                'Spartahack X',
                                style: GoogleFonts.josefinSans(
                                  fontStyle: FontStyle.italic,
                                  fontWeight: FontWeight.w300,
                                  color: CustomColorScheme.black,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                // TODO: Handle this case.
                AppScreensStateLoading() => Container(
                    height: MediaQuery.of(context).size.height * 0.5,
                    child: Column(
                      children: [
                        Expanded(
                          child: Center(
                            child: SpinKitDancingSquare(
                              color: Colors.black,
                              size: 100.0,
                            ),
                          ),
                        ),
                        SizedBox(
                          height: MediaQuery.of(context).size.height * 0.075,
                        ),
                        SizedBox(
                          height: 50.0,
                          width: double.infinity,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Created by Tanzil Zubair Bin Zaman & Reece Owen Roskam',
                                style: GoogleFonts.josefinSans(
                                  fontStyle: FontStyle.italic,
                                  fontWeight: FontWeight.w300,
                                  color: CustomColorScheme.black,
                                ),
                              ),
                              SizedBox(
                                height: 10,
                              ),
                              Text(
                                'Spartahack X',
                                style: GoogleFonts.josefinSans(
                                  fontStyle: FontStyle.italic,
                                  fontWeight: FontWeight.w300,
                                  color: CustomColorScheme.black,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                // TODO: Handle this case.
                AppScreensStateLoaded(:final EfficientResponse response) =>
                  Column(
                    children: [
                      Text(
                        "Using Aether saved you ${response.timeSaved}!",
                        style: GoogleFonts.josefinSans(fontSize: 25.0),
                      ),
                      SizedBox(
                        height: MediaQuery.of(context).size.height * 0.075,
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            height: MediaQuery.of(context).size.height * 0.5,
                            width: MediaQuery.of(context).size.width * 0.38,
                            decoration: BoxDecoration(
                              color: CustomColorScheme.cardColorWhite,
                              borderRadius: BorderRadius.circular(15.0),
                              boxShadow: <BoxShadow>[
                                BoxShadow(
                                  color: CustomColorScheme.cardShadowColor,
                                  blurRadius: 10.0, //40.0
                                  offset: const Offset(
                                    0,
                                    8, //16
                                  ),
                                ),
                              ],
                            ),
                            child: QueryComparisonCardOriginal(
                              response: response,
                              titleText: 'ORIGINAL',
                            ),
                          ),
                          SizedBox(
                            width: MediaQuery.of(context).size.width * 0.05,
                          ),
                          Container(
                            height: MediaQuery.of(context).size.height * 0.8,
                            width: MediaQuery.of(context).size.width * 0.42,
                            decoration: BoxDecoration(
                              color: CustomColorScheme.cardColorWhite,
                              borderRadius: BorderRadius.circular(15.0),
                              boxShadow: <BoxShadow>[
                                BoxShadow(
                                  color: CustomColorScheme.cardShadowColor,
                                  blurRadius: 10.0, //40.0
                                  offset: const Offset(
                                    0,
                                    8, //16
                                  ),
                                ),
                              ],
                            ),
                            child: QueryComparisonCardRefined(
                              response: response,
                              titleText: 'REFINED',
                            ),
                          ),
                        ],
                      ),
                      SizedBox(
                        height: MediaQuery.of(context).size.height * 0.075,
                      ),
                      SizedBox(
                        height: 50.0,
                        width: double.infinity,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Created by Tanzil Zubair Bin Zaman & Reece Owen Roskam',
                              style: GoogleFonts.josefinSans(
                                fontStyle: FontStyle.italic,
                                fontWeight: FontWeight.w300,
                                color: CustomColorScheme.black,
                              ),
                            ),
                            SizedBox(
                              height: 10,
                            ),
                            Text(
                              'Spartahack X',
                              style: GoogleFonts.josefinSans(
                                fontStyle: FontStyle.italic,
                                fontWeight: FontWeight.w300,
                                color: CustomColorScheme.black,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                // TODO: Handle this case.
                AppScreensStateError() => throw UnimplementedError(),
              };
            },
          ),
        ],
      ),
    );
  }
}

class Heading extends StatefulWidget {
  const Heading({
    super.key,
  });

  @override
  State<Heading> createState() => _HeadingState();
}

class _HeadingState extends State<Heading> with SingleTickerProviderStateMixin {
  late AnimationController controller;
  late Animation<double> animation;

  @override
  void initState() {
    controller = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 1000),
    );

    animation = Tween(
      begin: 0.0,
      end: 1.0,
    ).animate(controller);

    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    controller.forward();
    return FadeTransition(
      opacity: animation,
      child: Column(
        children: [
          Center(
            child: Text(
              "aetherAI",
              style: GoogleFonts.josefinSans(
                fontSize: 50.0,
                fontWeight: FontWeight.w400,
                letterSpacing: 10.0,
              ),
            ),
          ),
          SizedBox(
            height: 10,
          ),
          Center(
            child: Text(
              "Elevate Your Query, Empower Your Answers",
              style: GoogleFonts.josefinSans(
                fontSize: 17.0,
                fontWeight: FontWeight.w300,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
          Container(
            height: MediaQuery.of(context).size.height * 0.15,
            width: MediaQuery.of(context).size.width * 0.5,
            margin: EdgeInsets.only(
              top: MediaQuery.of(context).size.height * 0.025,
              left: MediaQuery.of(context).size.width * 0.25,
              right: MediaQuery.of(context).size.width * 0.25,
              bottom: MediaQuery.of(context).size.height * 0.015,
            ),
            alignment: Alignment.center,
            child: TextField(
              autocorrect: true,
              autofocus: true,
              style: GoogleFonts.josefinSans(),
              onSubmitted: (String? text) {
                context.read<AppScreensCubit>().request(text!);
              },
              decoration: InputDecoration(
                icon: Icon(
                  Icons.chevron_right,
                  size: 50.0,
                ),
                hintText: 'Enter query here',
                hintStyle: GoogleFonts.josefinSans(
                  fontStyle: FontStyle.italic,
                ),
                border: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.black),
                ),
                focusedBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.black),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }
}

class QueryComparisonCardOriginal extends StatelessWidget {
  const QueryComparisonCardOriginal({
    super.key,
    required this.response,
    required this.titleText,
  });

  final EfficientResponse response;
  final String titleText;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Row(
          mainAxisSize: MainAxisSize.max,
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            SizedBox(
              height: 15.0,
            ),
            Align(
              alignment: Alignment.topRight,
              child: IconButton(
                onPressed: () async {
                  await Clipboard.setData(
                    ClipboardData(
                        text: 'Original query: ${response.originalQuery}\n\n'
                            ' Original response: ${response.originalResponse}'),
                  ).then((_) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Copied to clipboard'),
                      ),
                    );
                  });
                },
                icon: Icon(
                  Icons.copy,
                  color: CustomColorScheme.darkGray,
                  size: 20.0,
                ),
              ),
            )
          ],
        ),
        Expanded(
          child: SizedBox(
            child: Padding(
              padding: EdgeInsets.only(
                left: 30.0,
                right: 30.0,
                bottom: 30.0,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  AutoSizeText(
                    titleText,
                    maxLines: 1,
                    style: GoogleFonts.josefinSans(
                      letterSpacing: 3,
                      fontWeight: FontWeight.w300,
                      fontSize: 25.0,
                    ),
                  ),
                  Expanded(
                    flex: 3,
                    child: SizedBox(
                      child: Center(
                        child: AutoSizeText(
                          response.originalQuery,
                          minFontSize: 16.0,
                          style: GoogleFonts.raleway(),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                  ),
                  SizedBox(
                    height: 15.0,
                  ),
                  Expanded(
                    flex: 15,
                    child: ListView(
                      children: [
                        SizedBox(
                          child: AutoSizeText(
                            response.originalResponse,
                            minFontSize: 13.0,
                            style: GoogleFonts.raleway(),
                            maxLines: 15,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class QueryComparisonCardRefined extends StatelessWidget {
  const QueryComparisonCardRefined({
    super.key,
    required this.response,
    required this.titleText,
  });

  final EfficientResponse response;
  final String titleText;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Row(
          mainAxisSize: MainAxisSize.max,
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            SizedBox(
              height: 15.0,
            ),
            Align(
              alignment: Alignment.topRight,
              child: IconButton(
                onPressed: () async {
                  await Clipboard.setData(
                    ClipboardData(
                        text: 'Refined query: ${response.refinedQuery}\n\n'
                            'Refined response: ${response.refinedResponse}'),
                  ).then((_) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Copied to clipboard'),
                      ),
                    );
                  });
                },
                icon: Icon(
                  Icons.copy,
                  color: CustomColorScheme.darkGray,
                  size: 20.0,
                ),
              ),
            )
          ],
        ),
        Expanded(
          child: SizedBox(
            child: Padding(
              padding: EdgeInsets.only(
                left: 30.0,
                right: 30.0,
                bottom: 30.0,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  AutoSizeText(
                    titleText,
                    maxLines: 1,
                    style: GoogleFonts.josefinSans(
                      letterSpacing: 3,
                      fontWeight: FontWeight.w300,
                      fontSize: 25.0,
                    ),
                  ),
                  Expanded(
                    flex: 3,
                    child: SizedBox(
                      child: Center(
                        child: AutoSizeText(
                          response.refinedQuery,
                          minFontSize: 16.0,
                          style: GoogleFonts.raleway(),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                  ),
                  SizedBox(
                    height: 15.0,
                  ),
                  Expanded(
                    flex: 15,
                    child: ListView(
                      children: [
                        SizedBox(
                          child: AutoSizeText(
                            response.refinedResponse,
                            minFontSize: 13.0,
                            style: GoogleFonts.raleway(),
                            maxLines: 100,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
