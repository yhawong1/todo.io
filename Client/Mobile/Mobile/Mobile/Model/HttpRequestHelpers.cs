using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Xamarin.Forms;

namespace Mobile.Model
{
    public static class HttpRequestHelpers
    {
        public static readonly string endpoint = "127.0.0.1";

        public static void GetAsync<TObject>(Uri uri, Action<TObject> onComplete, CancellationToken? token = null)
            where TObject : JsonSerializableObject
        {
            Task.Run(async () =>
            {
                await Task.Delay(2000);

                var json = new UserAuth()
                {
                    Foo = "Test"
                };

                var request = (HttpWebRequest)WebRequest.CreateHttp("http://127.0.0.1/email?action=send");
                request.Method = "POST";
                
                request.BeginGetRequestStream(
                    (a) => 
                    {                        
                        if (onComplete != null)
                        {
                            Device.BeginInvokeOnMainThread(() => {
                                onComplete(JsonSerializableObject.CreateFromJson<TObject>(json.ToString()));
                            });
                        }
                    },
                    null);

                /*
                var httpClient = HttpWebRequest.CreateHttp(uri);

                return JsonSerializableObject.CreateFromJson<TObject>("");
                */
            });
        }

        public static void PostAsync<TObject>(
            Uri uri, 
            TObject body,
            Action<TObject> onComplete, 
            CancellationToken? token = null)
            where TObject : JsonSerializableObject
        {
            Task.Run(() =>
            {
                var request = (HttpWebRequest)WebRequest.CreateHttp(uri);

                request.Method = "POST";

                var asyncResult = request.BeginGetRequestStream(
                    (a) =>
                    {
                        if (onComplete != null)
                        {
                            var json = new UserAuth()
                            {
                                Foo = "Test"
                            };
                            Device.BeginInvokeOnMainThread(() => {
                                onComplete(JsonSerializableObject.CreateFromJson<TObject>(json.ToString()));
                            });
                        }
                    },
                    null);

                /*
                using (var streamWriter = new StreamWriter(request.BeginGetRequestStream()))
                {
                    string json = "{\"user\":\"test\"," +
                                  "\"password\":\"bla\"}";

                    streamWriter.Write(json);
                    streamWriter.Flush();
                    streamWriter.Close();
                }

                byte[] byteArray = Encoding.UTF8.GetBytes(body.ToString());
                // Set the ContentType property of the WebRequest.
                request.ContentType = "application/json; charset=utf-8";
                // Get the request stream.
               
                // Write the data to the request stream.
                dataStream.Write(byteArray, 0, byteArray.Length);
                // Close the Stream object.
                dataStream.Close();
                // Get the response.
                WebResponse response = request.GetResponse();
                // Display the status.
                Console.WriteLine(((HttpWebResponse)response).StatusDescription);
                // Get the stream containing content returned by the server.
                dataStream = response.GetResponseStream();
                // Open the stream using a StreamReader for easy access.
                StreamReader reader = new StreamReader(dataStream);
                // Read the content.
                string responseFromServer = reader.ReadToEnd();
                // Display the content.
                Console.WriteLine(responseFromServer);
                // Clean up the streams.
                reader.Close();
                dataStream.Close();
                response.Close();
                */
            });
        }
    }
}
