# Use App Check to secure your API key


[Firebase App Check](https://firebase.google.com/docs/app-check) provides protection for calls from your app to Google Maps Platform by blocking traffic that comes from sources other than legitimate apps. It does this by checking for a token from an attestation provider like [reCAPTCHA Enterprise](https://cloud.google.com/recaptcha-enterprise). Integrating your apps with App Check helps to protect against malicious requests, so you're not charged for unauthorized API calls.

## Is App Check right for me?


App Check is recommended in most cases, however App Check is not needed or is not supported in the following cases:

- You are using the original Places SDK. **App Check is only supported for Places SDK (New)**.
- Private or experimental apps. If your app is not publicly accessible, App Check is not needed.
- If your app is only used server-to-server, App Check is not needed. However, if the server that communicates with GMP is used by public clients (such as mobile apps), consider [using App Check to protect that server](https://firebase.google.com/docs/app-check/custom-resource-backend) instead of GMP.

## Overview of implementation steps

At a high level, these are the steps you'll follow to integrate your app with App Check:

1. Add Firebase to your app.
2. Add and initialize the App Check library.
3. Add the token provider to your app.
4. Initialize the Places and App Check APIs.
5. Enable debugging.
6. Monitor your app requests and decide on enforcement.


Once you've integrated with App Check, you'll be able to see backend traffic metrics on the Firebase console. These metrics provide breakdown of requests by whether they are accompanied by a valid App Check token. See the [Firebase App Check documentation](https://firebase.google.com/docs/app-check/monitor-metrics) for more information.


When you're sure that most requests are from legitimate sources and that users have updated to the latest version of your app that includes your implementation of App Check, you can turn on enforcement. Once enforcement is on, App Check will reject all traffic without a valid App Check token.

> [!NOTE]
> **Note:** App check enforcement is not turned on by default.

## Considerations when planning an App Check integration


Here are some things to consider as you plan your integration:

- One of the attestation providers we recommend, [reCAPTCHA Enterprise](https://cloud.google.com/recaptcha-enterprise) charges for more than 10,000 assessments per month.

  The other attestation provider we recommend, [reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3) has a quota, after which traffic won't be evaluated.

  You can choose to use a custom attestation provider, though this is an advanced use case. See the [App Check documentation](https://firebase.google.com/docs/app-check/custom-provider) for more information.
- Users of your app will experience some latency on startup. However, afterwards, any periodic re-attestation will occur in the background and users should no longer experience any latency. The exact amount of latency at startup depends on the attestation provider you choose.

  The amount of time that the App Check token is valid (the *time to live*, or TTL) determines the frequency of re-attestations. This duration can be configured in the Firebase console. Re-attestation occurs when approximately halkf of the TTL has elapsed. For more information, see the [Firebase docs](https://firebase.google.com/docs/app-check#get_started) for your attestation provider.

## Integrate your app with App Check

> [!NOTE]
> Note: Get help faster! For support regarding the Firebase-related portions of this process, see [Firebase support](https://firebase.google.com/support). For support regarding the Google Places API, see [Google Maps Platform support](https://developers.google.com/maps/support).

### Prerequisites and requirements

- An app with the [the latest weekly or quarterly version of the Maps JS API](https://developers.google.com/maps/documentation/javascript/versions), Core, and Places libraries loaded.
- A Cloud project with the Maps JS and the Places API (New) APIs enabled.
- You must be the owner of the app in Cloud Console.
- You will need the app's project ID from the Cloud Console

### Step 1: Add Firebase to your app


Follow [the instructions in the Firebase developer documentation](https://firebase.google.com/docs/web/setup) to add Firebase to your app.


### Step 2: Add the App Check library and initialize App Check

Firebase provides instructions for each default attestation provider. These instructions show you how to set up a Firebase project and add the App Check library to your app. Follow the code samples provided to initialize App Check.

- [Instructions for reCAPTCHA Enterprise](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).
- [Instructions for reCAPTCHA v3](https://firebase.google.com/docs/app-check/web/recaptcha-provider).

  > [!NOTE]
  > You must register your site for reCAPTCHA v3 and get your reCAPTCHA v3 site key and secret key using the reCAPTCHA site registration tool before you enable the API on the Cloud Console. See the [reCAPTCHA v3 documentation](https://developers.google.com/recaptcha/intro) for more information and instructions.

### Step 3: Load Maps JS API libraries

1. Load the core, Maps, and Places libraries as shown in the following snippet. For more information and instructions, see the [Maps JavaScript API Place Class documentation](https://developers.google.com/maps/documentation/javascript/place-get-started#load-the-places-library).

   ```javascript
   async function init() {
     const {Settings} = await google.maps.importLibrary('core');
     const {Map} = await google.maps.importLibrary('maps');
     const {Place} = await google.maps.importLibrary('places');
   }  
   ```

### Step 4: Initialize the Places and App Check APIs

1. Initialize App Check using the config provided by the Firebase console.
   - [reCAPTCHA v3 instructions](https://firebase.google.com/docs/app-check/web/recaptcha-provider).
   - [reCAPTCHA Enterprise instructions.](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)
2. Ensure that requests to the Maps JS API are accompanied by App Check tokens:

   ```javascript
     async function init() {
       const {Settings} = await google.maps.importLibrary('core');
       const {Map} = await google.maps.importLibrary('maps');
       const {Place} = await google.maps.importLibrary('places');
     
       const app = initializeApp({
         // Your firebase configuration object
       });
     
       // Pass your reCAPTCHA Enterprise site key to initializeAppCheck().
       const appCheck = initializeAppCheck(app, {
         provider: new ReCaptchaEnterpriseProvider(
           'abcdefghijklmnopqrstuvwxy-1234567890abcd',
         ),
     
         // Optional argument. If true, the SDK automatically refreshes App Check
         // tokens as needed.
         isTokenAutoRefreshEnabled: true,
       });
     
       Settings.getInstance().fetchAppCheckToken = () =>
           getToken(appCheck, /* forceRefresh = */ false);
     
       // Make a Places JS request
       const place = new Place({id: 'ChIJN5Nz71W3j4ARhx5bwpTQEGg'});
       await place.fetchFields({fields: ['*']});
     
       // Load a map
       map = new Map(document.getElementById("map"), {
         center: { lat: 37.4161493, lng: -122.0812166 },
         zoom: 8,
       });
     }  
     
   ```

### Step 5: Enable debugging (optional)

If you'd like to develop and test your app locally, or run it in a continuous integration (CI) environment, you can create a debug build of your app that uses a debug secret to obtain valid App Check tokens. This lets you avoid using real attestation providers in your debug build.

To test your app locally:

- Activate the debug provider for development purposes.
- You will receive an automatically generated random UUID4 (called the _debug token_ in the App Check documentation) from the SDK's debug logs. Add this token to the Firebase console.
- For more information and instructions, see the [App Check documentation](https://firebase.google.com/docs/app-check/web/debug-provider#localhost).

To run your app in a CI environment:

- Generate a random UUID4 from the Firebase console.
- Add the UUID4 as a debug token, and then copy it into a secret store that the CI tests will access per test run.
- For more information and instructions, see the [App Check documentation](https://firebase.google.com/docs/app-check/web/debug-provider#ci).

### Step 6: Monitor your app requests and decide on enforcement


Before you begin enforcement, you'll want to make sure that you won't disrupt legitimate users of your app. To do this, visit the App Check metrics screen to see what percentage of your app's traffic is verified, outdated, or illegitimate. Once you see that the majority of your traffic is verified, you can enable enforcement.


See the [Firebase App Check documentation](https://firebase.google.com/docs/app-check/monitor-metrics) for more information and instructions.

> [!NOTE]
> Before you enforce App Check, make sure any Web Service calls in your Cloud project use [OAuth](https://developers.google.com/maps/documentation/places/web-service/oauth-token).