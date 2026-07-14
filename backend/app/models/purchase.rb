class Purchase < ApplicationRecord
  belongs_to :user

  validates :currency, :card_name, presence: true
  validates :foreign_amount, :exchange_rate, :fee_rate, numericality: { greater_than_or_equal_to: 0 }
  validates :purchase_date, presence: true
end
