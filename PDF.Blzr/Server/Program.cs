using Microsoft.AspNetCore.ResponseCompression;

namespace PDF.Blzr
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllersWithViews();
            builder.Services.AddRazorPages();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseWebAssemblyDebugging();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();

            app.UseBlazorFrameworkFiles();
            app.UseStaticFiles();

            app.UseRouting();


            app.MapRazorPages();
            app.MapControllers();
            
            app.MapFallbackToFile("index.html");

            // This is required to route requests with . (dot) in param name.
            // Details here: https://learn.microsoft.com/en-us/aspnet/core/blazor/fundamentals/routing?view=aspnetcore-7.0#routing-with-urls-that-contain-dots
            app.MapFallbackToFile("/pdfjs/{filename}", "index.html");
            app.MapFallbackToFile("/googlepdf/{filename}", "index.html");

            app.Run();
        }
    }
}