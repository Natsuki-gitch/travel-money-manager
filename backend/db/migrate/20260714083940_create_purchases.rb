class CreatePurchases < ActiveRecord::Migration[7.1]
  def change
    create_table :purchases do |t|
      t.references :user, null: false, foreign_key: true
      t.string :item_name, null: false
      t.string :currency, null: false
      t.decimal :foreign_amount, precision: 12, scale: 2, null: false
      t.decimal :exchange_rate, precision: 10, scale: 4, null: false
      t.string :card_name, null: false
      t.decimal :fee_rate, precision: 5, scale: 2, null: false
      t.integer :jpy_amount, null: false
      t.date :purchase_date, null: false

      t.timestamps
    end
  end
end
