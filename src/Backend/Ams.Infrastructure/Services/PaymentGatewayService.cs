namespace Ams.Infrastructure.Services;

public interface IPaymentGatewayService
{
    Task<PaymentResult> ProcessPaymentAsync(decimal amount, string currency, string tokenOrCardData);
}

public class PaymentResult
{
    public bool Success { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
}

public class PaymentGatewayService : IPaymentGatewayService
{
    public async Task<PaymentResult> ProcessPaymentAsync(decimal amount, string currency, string tokenOrCardData)
    {
        // Simulate network delay to a real gateway
        await Task.Delay(1500);

        // Simple mock logic: if the card data contains "fail", it declines.
        if (tokenOrCardData.Contains("fail", StringComparison.OrdinalIgnoreCase))
        {
            return new PaymentResult
            {
                Success = false,
                ErrorMessage = "Your card was declined."
            };
        }

        return new PaymentResult
        {
            Success = true,
            TransactionId = "ch_" + Guid.NewGuid().ToString("N").Substring(0, 16)
        };
    }
}
