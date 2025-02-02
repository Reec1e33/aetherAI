import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:spartahack_frontend/ColorScheme.dart';
import 'package:spartahack_frontend/blocs/bloc.dart';

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
      body: Column(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Text(
            "AETHER",
            style: TextStyle(
              letterSpacing: 40.0,
              fontSize: 25.0,
              fontWeight: FontWeight.w700,
            ),
          ),
          Container(
            height: MediaQuery.of(context).size.height * 0.3,
            width: MediaQuery.of(context).size.width * 0.5,
            margin: EdgeInsets.symmetric(
                horizontal: MediaQuery.of(context).size.width * 0.25),
            decoration: BoxDecoration(
                // color: Colors.red,
                ),
            alignment: Alignment.center,
            child: TextField(
              autocorrect: true,
              autofocus: true,
              onChanged: (String? text) {
                print(text);
              },
              onSubmitted: (String? text) {
                context.read<AppScreensCubit>().request(text!);
              },
              decoration: InputDecoration(
                icon: Icon(
                  Icons.abc,
                  size: 50.0,
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
          BlocBuilder<AppScreensCubit, AppScreensState>(
            builder: (BuildContext context, AppScreensState state) {
              return switch (state) {
                // TODO: Handle this case.
                AppScreensStateInitial() => Container(
                    height: MediaQuery.of(context).size.height * 0.3,
                    width: MediaQuery.of(context).size.width,
                    color: CustomColorScheme.gestureTarget,
                  ),
                // TODO: Handle this case.
                AppScreensStateLoading() => SpinKitDancingSquare(
                    color: Colors.black,
                  ),
                // TODO: Handle this case.
                AppScreensStateLoaded() => throw UnimplementedError(),
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
