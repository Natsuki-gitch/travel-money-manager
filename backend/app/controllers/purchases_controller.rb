class PurchasesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_purchase, only: [:update, :destroy]

  def index
    render json: current_user.purchases.order(purchase_date: :desc, id: :desc)
  end

  def create
    purchase = current_user.purchases.new(purchase_params)
    purchase.jpy_amount = calculate_jpy_amount(purchase)

    if purchase.save
      render json: purchase, status: :created
    else
      render json: { errors: purchase.errors.full_messages }, status: :unprocessable_content
    end
  end

  # 商品名のみ後から編集可能。他の項目は登録後変更不可（Ver1.0の方針）。
  def update
    if @purchase.update(item_name_param)
      render json: @purchase
    else
      render json: { errors: @purchase.errors.full_messages }, status: :unprocessable_content
    end
  end

  def destroy
    @purchase.destroy
    head :no_content
  end

  private

  def set_purchase
    @purchase = current_user.purchases.find(params[:id])
  end

  def purchase_params
    params.require(:purchase).permit(
      :item_name, :currency, :foreign_amount, :exchange_rate,
      :card_name, :fee_rate, :purchase_date
    )
  end

  def item_name_param
    params.require(:purchase).permit(:item_name)
  end

  def calculate_jpy_amount(purchase)
    (purchase.foreign_amount * purchase.exchange_rate * (1 + purchase.fee_rate / 100)).round
  end
end
